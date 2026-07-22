const { generateSummary } = require("../services/aiService");
const { getRoom, updateRoom, deleteRoom } = require("../store/roomStore");

const SCORING = {
    BASE_SCORE: 1000,
    PENALTY_PER_SECOND: 50,
    MIN_SCORE: 100,
}

const QUESTION_TIME_LIMIT_SECONDS = 20;

// Per-question runtime bookkeeping (timer, answered players). Not part of the persisted Room shape (PRD 14) — kept separately since it's ephemeral game state.

const gameState = new Map()

function getGameState(roomCode) {
    let state = gameState.get(roomCode)
    if (!state) {
        state = { timeoutId: null, questionStartedAt: null, answeredSocketIds: new Set() }
        gameState.set(roomCode, state)
    }

    return state
}

function clearGameState(roomCode) {
    const state = gameState.get(roomCode)
    if (state?.timeoutId) {
        clearTimeout(state.timeoutId)
    }
    gameState.delete(roomCode)
}

function emitError(socket, message) {
    socket.emit('error', { message })
}

function buildQuestionPayload(room, questionIndex) {
    const question = room.questions[questionIndex]
    return {
        questionNumber: questionIndex + 1,
        totalQuestions: room.questions.length,
        question: question.question,
        options: question.options,
        timeLimit: QUESTION_TIME_LIMIT_SECONDS,
    }
}

function computeRankings(players) {
    return [...players]
        .sort((a, b) => b.score - a.score)
        .map((player) => ({ username: player.username, score: player.score }))
}

function beginQuestion(io, roomCode, questionIndex, eventName) {
    const room = getRoom(roomCode)
    if (!room) {
        return
    }

    const state = getGameState(roomCode)
    if (state.timeoutId) {
        clearTimeout(state.timeoutId)
    }
    state.questionStartedAt = Date.now()
    state.answeredSocketIds = new Set()
    state.timeoutId = setTimeout(() => {
        advanceQuestion(io, roomCode)
    }, QUESTION_TIME_LIMIT_SECONDS * 1000)

    io.to(roomCode).emit(eventName, buildQuestionPayload(room, questionIndex))
}

async function finishGame(io, roomCode, room) {
    updateRoom(roomCode, { status: 'finished' })
    clearGameState(roomCode)

    const finalRankings = computeRankings(room.players)
    io.to(roomCode).emit('game_over', { finalRankings })

    let summaryText
    try {
        summaryText = await generateSummary(finalRankings)
    } catch (error) {
        console.error(`generateSummary gagal untuk room ${roomCode}:`, error.message)
        summaryText = 'Ringkasan AI tidak tersedia saat ini.'
    }

    io.to(roomCode).emit('summary', { summaryText })
}

function advanceQuestion(io, roomCode) {
    const room = getRoom(roomCode)
    if (!room) {
        clearGameState(roomCode)
        return
    }

    const state = getGameState(roomCode)

    if (state.timeoutId) {
        clearTimeout(state.timeoutId)
        state.timeoutId = null
    }

    io.to(roomCode).emit('leaderboard', { rankings: computeRankings(room.players) })

    const nextIndex = room.currentQuestion + 1
    if (nextIndex >= room.questions.length) {
        finishGame(io, roomCode, room).catch((err) => {
            console.error(`finishGame gagal untuk room ${roomCode}:`, err)
        })
        return
    }

    updateRoom(roomCode, { currentQuestion: nextIndex })
    beginQuestion(io, roomCode, nextIndex, 'next_question')
}

function registerTriviaHandlers(io, socket) {
    socket.on('join_room', (payload = {}) => {
        const { roomCode, username, isHost } = payload

        if (typeof roomCode !== 'string' || !roomCode.trim()) {
            return emitError(socket, 'roomCode wajib diisi');
        }

        if (typeof username !== 'string' || !username.trim()) {
            return emitError(socket, 'username wajib diisi');
        }

        const room = getRoom(roomCode);
        if (!room) {
            return emitError(socket, `Room ${roomCode} tidak ditemukan`);
        }
        if (room.status === 'playing') {
            return emitError(socket, 'Game di room ini sudah dimulai, tidak bisa bergabung lagi');
        }
        if (room.status === 'finished') {
            return emitError(socket, 'Game di room ini sudah selesai');
        }

        socket.join(roomCode)
        socket.data.roomCode = roomCode

        const existingPlayers = room.players.filter((p) => p.socketId !== socket.id)
        const updatedPlayers = [
            ...existingPlayers,
            { username: username.trim(), socketId: socket.id, score: 0 }
        ]

        const patch = { players: updatedPlayers }
        if (isHost) {
            patch.hostId = socket.id
        }

        const updatedRoom = updateRoom(roomCode, patch)
        io.to(roomCode).emit('player_joined', { players: updatedRoom.players })
    })

    socket.on('start_game', (payload = {}) => {
        const { roomCode } = payload

        if (typeof roomCode !== 'string' || !roomCode.trim()) {
            return emitError(socket, 'roomCode wajib diisi');
        }

        const room = getRoom(roomCode);
        if (!room) {
            return emitError(socket, `Room ${roomCode} tidak ditemukan`);
        }
        if (room.hostId !== socket.id) {
            return emitError(socket, 'Hanya host yang boleh memulai game');
        }
        if (!Array.isArray(room.questions) || room.questions.length === 0) {
            return emitError(socket, 'Room ini belum punya soal');
        }
        if (room.status === 'playing') {
            return emitError(socket, 'Game sudah berjalan');
        }

        updateRoom(roomCode, { status: 'playing', currentQuestion: 0 })
        beginQuestion(io, roomCode, 0, 'question')
    })

    socket.on('submit_answer', (payload = {}) => {
        const { roomCode, answer } = payload;

        if (typeof roomCode !== 'string' || !roomCode.trim()) {
            return emitError(socket, 'roomCode wajib diisi');
        }

        const room = getRoom(roomCode);
        if (!room) {
            return emitError(socket, `Room ${roomCode} tidak ditemukan`);
        }
        if (room.status !== 'playing') {
            return emitError(socket, 'Game belum dimulai atau sudah selesai');
        }

        const player = room.players.find((p) => p.socketId === socket.id);
        if (!player) {
            return emitError(socket, 'Kamu belum bergabung ke room ini');
        }

        const question = room.questions[room.currentQuestion];
        if (!question) {
            return emitError(socket, 'Tidak ada soal aktif saat ini');
        }

        const state = getGameState(roomCode);
        if (state.answeredSocketIds.has(socket.id)) {
            return emitError(socket, 'Kamu sudah menjawab soal ini');
        }
        state.answeredSocketIds.add(socket.id);

        if (answer === question.answer) {
            const elapsedSeconds = state.questionStartedAt
                ? Math.floor((Date.now() - state.questionStartedAt) / 1000)
                : 0;
            const earnedScore = Math.max(
                SCORING.MIN_SCORE,
                SCORING.BASE_SCORE - elapsedSeconds * SCORING.PENALTY_PER_SECOND,
            );
            const updatedPlayers = room.players.map((p) =>
                p.socketId === socket.id ? { ...p, score: p.score + earnedScore } : p,
            );
            updateRoom(roomCode, { players: updatedPlayers });
        }

        const currentRoom = getRoom(roomCode);
        if (state.answeredSocketIds.size >= currentRoom.players.length) {
            advanceQuestion(io, roomCode);
        }
    });

    socket.on('disconnect', () => {
        const roomCode = socket.data.roomCode;
        if (!roomCode) {
            return;
        }

        const room = getRoom(roomCode);
        if (!room) {
            return;
        }

        const updatedPlayers = room.players.filter((p) => p.socketId !== socket.id);

        if (updatedPlayers.length === 0) {
            clearGameState(roomCode);
            deleteRoom(roomCode);
            return;
        }

        const patch = { players: updatedPlayers };
        const wasHost = room.hostId === socket.id;
        if (wasHost && room.status === 'waiting') {
            patch.hostId = updatedPlayers[0].socketId;
        }

        const updatedRoom = updateRoom(roomCode, patch);
        io.to(roomCode).emit('player_joined', { players: updatedRoom.players });
    });
}

module.exports = registerTriviaHandlers
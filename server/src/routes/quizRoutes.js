const { generateQuestions } = require("../services/aiService");
const { createRoom, getRoom } = require("../store/roomStore");
const { Router } = require("express");

const router = Router()

const ROOM_CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const ROOM_CODE_LENGTH = 6;

function generateRoomCode() {
    let code = ''
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
        code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)]
    }

    return code
}

function generateUniqueRoomCode() {
    let code = generateRoomCode();
    while (getRoom(code)) {
        code = generateRoomCode()
    }
    return code
}

router.get('/health', (req, res) => {
    res.json({ status: 'ok' })
})

router.post('/generate-quiz', async (req, res) => {
    const body = req.body ?? {};
    const { topic, difficulty, totalQuestion } = body

    if (typeof topic !== 'string' || !topic.trim()) {
        return res.status(400).json({ error: 'Field "topic" wajib diisi dan berupa string' });
    }

    if (typeof difficulty !== 'string' || !difficulty.trim()) {
        return res.status(400).json({ error: 'Field "difficulty" wajib diisi dan berupa string' });
    }

    const totalQuestionNum = Number(totalQuestion);
    if (!Number.isInteger(totalQuestionNum) || totalQuestionNum < 1) {
        return res.status(400).json({ error: 'Field "totalQuestion" wajib berupa angka bulat positif' });
    }

    let questions
    try {
        questions = await generateQuestions(topic.trim(), difficulty.trim(), totalQuestionNum)
    } catch (error) {
        return res.status(502).json({ error: `Gagal generate soal dari AI: ${error.message}` });
    }

    const roomCode = generateUniqueRoomCode()

    createRoom({
        roomCode,
        topic: topic.trim(),
        difficulty: difficulty.trim(),
        status: 'waiting',
        currentQuestion: 0,
        players: [],
        questions,
    })

    res.json({roomCode, questions})
})

module.exports = router


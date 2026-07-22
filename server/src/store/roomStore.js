const rooms = new Map()

function createRoom(data) {
    const room = {
        roomCode: data.roomCode,
        hostId: data.hostId ?? null,
        topic: data.topic,
        difficulty: data.difficulty,
        status: data.status ?? 'waiting',
        currentQuestion: data.currentQuestion ?? 0,
        players: data.players ?? [],
        questions: data.questions ?? [],
    }
    rooms.set(room.roomCode, room)
    return room
}

function getRoom(roomCode) {
    return rooms.get(roomCode) ?? null
}

function updateRoom(roomCode, patch) {
    const room = rooms.get(roomCode)
    if(!room) {
        return null;
    }

    const updated = {...room, ...patch}
    rooms.set(roomCode, updated)
    return updated
}

function deleteRoom(roomCode){
    return rooms.delete(roomCode)
}

module.exports = { createRoom, getRoom, updateRoom, deleteRoom };
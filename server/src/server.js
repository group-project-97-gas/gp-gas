require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const registerTriviaHandlers = require('./socket/triviaHandlers');
const router = require('./routes/quizRoutes');

// setup server

const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const app = express();
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());
app.use(router);

app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    res.status(status).json({ error: err.message || 'Terjadi kesalahan pada server' });
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: { origin: CLIENT_URL },
});

io.on('connection', (socket) => {
    registerTriviaHandlers(io, socket);
});

httpServer.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
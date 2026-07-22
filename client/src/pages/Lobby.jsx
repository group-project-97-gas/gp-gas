import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useRoom } from '../context/RoomContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import PlayerList from '../components/PlayerList.jsx';
import Button from '../components/Button.jsx';
import TextField from '../components/TextField.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';

function Lobby() {
    const { roomCode: roomCodeFromUrl } = useParams();
    const navigate = useNavigate();
    const socket = useSocket();
    const {
        roomCode,
        isHost,
        setIsHost,
        setUsername,
        setRoomCode,
        players,
        resetRoom,
    } = useRoom();

    const hasJoined =
        (isHost && roomCode === roomCodeFromUrl) ||
        players.some((player) => player.socketId === socket.id);

    const [joinUsername, setJoinUsername] = useState('');
    const [joinRoomCode, setJoinRoomCode] = useState(roomCodeFromUrl ?? '');
    const [isJoining, setIsJoining] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        function handleError(payload) {
            setErrorMessage(payload.message);
            setIsJoining(false);
        }

        function handleQuestion() {

            navigate(`/game/${roomCodeFromUrl}`);
        }

        socket.on('error', handleError);
        socket.on('question', handleQuestion);

        return () => {
            socket.off('error', handleError);
            socket.off('question', handleQuestion);
        };
    }, [socket, navigate, roomCodeFromUrl]);

    function handleJoinSubmit(e) {
        e.preventDefault();

        const trimmedUsername = joinUsername.trim();
        const trimmedRoomCode = joinRoomCode.trim();
        if (!trimmedUsername || !trimmedRoomCode) {
            return;
        }

        setErrorMessage('');
        setIsJoining(true);
        resetRoom();
        setUsername(trimmedUsername);
        setIsHost(false);
        setRoomCode(trimmedRoomCode);

        socket.emit('join_room', {
            roomCode: trimmedRoomCode,
            username: trimmedUsername,
            isHost: false,
        });
    }

    function handleStartGame() {
        socket.emit('start_game', { roomCode: roomCodeFromUrl });
    }

    if (!hasJoined) {
        return (
            <div className="flex flex-col gap-4">
                <h1 className="font-display text-xl font-bold uppercase tracking-wide text-cyber-text">
                    Join Room
                </h1>

                <ErrorBanner message={errorMessage} />

                <form onSubmit={handleJoinSubmit} className="flex flex-col gap-4">
                    <TextField
                        label="Username"
                        value={joinUsername}
                        onChange={(e) => setJoinUsername(e.target.value)}
                        disabled={isJoining}
                    />
                    <TextField
                        label="Room Code"
                        value={joinRoomCode}
                        onChange={(e) => setJoinRoomCode(e.target.value)}
                        disabled={isJoining}
                    />
                    <Button type="submit" disabled={isJoining} className="w-full">
                        {isJoining ? 'Joining...' : 'Join Room'}
                    </Button>
                </form>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="font-display text-xl font-bold uppercase tracking-wide text-cyber-text">
                    Lobby
                </h1>
                <p className="text-sm text-cyber-dim">
                    Room Code:{' '}
                    <span className="font-mono font-bold text-cyber-yellow neon-yellow">
                        {roomCodeFromUrl}
                    </span>
                </p>
            </div>

            <ErrorBanner message={errorMessage} />

            <div>
                <p className="cyber-label mb-2 text-xs">Pemain ({players.length})</p>
                <PlayerList players={players} />
            </div>

            {isHost && (
                <Button onClick={handleStartGame} className="w-full">
                    Start Game
                </Button>
            )}
        </div>
    );
}

export default Lobby;

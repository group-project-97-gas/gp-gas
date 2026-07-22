import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useRoom } from '../context/RoomContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { generateQuiz, getApiErrorMessage } from '../services/api.js';
import Button from '../components/Button.jsx';
import TextField from '../components/TextField.jsx';
import SelectField from '../components/SelectField.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import Spinner from '../components/Spinner.jsx';

const DIFFICULTIES = ['easy', 'medium', 'hard'];

function CreateQuiz() {
    const navigate = useNavigate();
    const socket = useSocket();
    const { setUsername, setIsHost, setRoomCode, setQuestions, resetRoom } = useRoom();

    const [usernameInput, setUsernameInput] = useState('');
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState('easy');
    const [totalQuestion, setTotalQuestion] = useState('5');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();

        const trimmedUsername = usernameInput.trim();
        const trimmedTopic = topic.trim();

        if (!trimmedUsername || !trimmedTopic || !totalQuestion) {
            setErrorMessage('Semua field wajib diisi.');
            return;
        }

        setErrorMessage('');
        setIsSubmitting(true);
        resetRoom();

        try {
            const { roomCode, questions } = await generateQuiz({
                topic: trimmedTopic,
                difficulty,
                totalQuestion: Number(totalQuestion),
            });

            setUsername(trimmedUsername);
            setIsHost(true);
            setRoomCode(roomCode);
            setQuestions(questions);

            socket.emit('join_room', {
                roomCode,
                username: trimmedUsername,
                isHost: true,
            });

            navigate(`/lobby/${roomCode}`);
        } catch (err) {
            setErrorMessage(getApiErrorMessage(err));
            setIsSubmitting(false);
        }
    }

    if (isSubmitting) {
        return (
            <div className="flex flex-col gap-4">
                <h1 className="font-display text-xl font-bold uppercase tracking-wide text-cyber-text">
                    Create Quiz
                </h1>
                <div className="flex flex-col items-center gap-3 py-8">
                    <Spinner />
                    <p className="text-center font-mono text-sm text-cyber-dim">
                        Membuat soal quiz dengan AI, tunggu sebentar (kurang lebih ~10 detik)...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <h1 className="font-display text-xl font-bold uppercase tracking-wide text-cyber-text">
                Create Quiz
            </h1>

            <ErrorBanner message={errorMessage} />

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <TextField
                    label="Username"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                />
                <TextField label="Topic" value={topic} onChange={(e) => setTopic(e.target.value)} />
                <SelectField
                    label="Difficulty"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                >
                    {DIFFICULTIES.map((level) => (
                        <option key={level} value={level}>
                            {level}
                        </option>
                    ))}
                </SelectField>
                <TextField
                    label="Question Count"
                    type="number"
                    min="1"
                    value={totalQuestion}
                    onChange={(e) => setTotalQuestion(e.target.value)}
                />
                <Button type="submit" className="w-full">
                    Generate with AI
                </Button>
            </form>
        </div>
    );
}

export default CreateQuiz;

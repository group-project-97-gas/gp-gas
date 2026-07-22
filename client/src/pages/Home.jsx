import { useState } from 'react';
import { useNavigate } from 'react-router';
import Button from '../components/Button.jsx';
import TextField from '../components/TextField.jsx';

function Home() {
    const navigate = useNavigate();
    const [roomCodeInput, setRoomCodeInput] = useState('');

    function handleJoinSubmit(e) {
        e.preventDefault();
        const trimmed = roomCodeInput.trim();
        if (!trimmed) {
            return;
        }
        navigate(`/lobby/${trimmed}`);
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="text-center">
                <h2 className="font-display text-lg font-bold uppercase tracking-wide text-cyber-text">
                    Jack In, Choom
                </h2>
                <p className="mt-2 text-sm text-cyber-dim">
                    Buat room kuis baru, atau gabung ke room teman kamu pakai kode room.
                </p>
            </div>

            <Button onClick={() => navigate('/create')} className="w-full">
                Create Room
            </Button>

            <form onSubmit={handleJoinSubmit} className="flex flex-col gap-3 border-t border-cyber-border pt-6">
                <TextField
                    label="Join Room"
                    placeholder="Masukkan Room Code"
                    value={roomCodeInput}
                    onChange={(e) => setRoomCodeInput(e.target.value)}
                />
                <Button type="submit" variant="secondary" className="w-full">
                    Join Room
                </Button>
            </form>
        </div>
    );
}

export default Home;

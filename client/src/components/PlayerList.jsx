import { useSocket } from '../context/SocketContext.jsx';
import { useRoom } from '../context/RoomContext.jsx';

function PlayerList({ players }) {
    const socket = useSocket();
    const { isHost } = useRoom();

    return (
        <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto">
            {players.map((player) => {
            
                const isMeAndHost = isHost && player.socketId === socket.id;

                return (
                    <li
                        key={player.socketId}
                        className="cyber-card cyber-panel-sm flex min-w-0 items-center gap-2 p-3"
                    >
                        {isMeAndHost && (
                            <span
                                className="cyber-badge shrink-0 px-1.5 py-0.5 text-[10px]"
                                style={{ background: 'var(--color-cyber-pink)', color: '#0a0a0f' }}
                            >
                                HOST
                            </span>
                        )}
                        <span className="truncate font-medium">{player.username}</span>
                        <span className="ml-auto shrink-0 font-mono text-sm font-bold text-cyber-cyan">
                            {player.score}
                        </span>
                    </li>
                );
            })}
        </ul>
    );
}

export default PlayerList;

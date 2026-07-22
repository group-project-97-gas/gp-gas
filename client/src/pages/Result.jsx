import { useNavigate, useParams } from "react-router";
import { useRoom } from "../context/RoomContext.jsx";
import Leaderboard from "../components/Leaderboard.jsx";
import SummaryCard from "../components/SummaryCard.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Button from "../components/Button.jsx";

function Result() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { leaderboard, summaryText, resetRoom } = useRoom();

  if (leaderboard.length === 0) {
    return (
      <EmptyState
        title="Hasil tidak ditemukan"
        description="Room ini mungkin sudah tidak aktif, atau sesi kamu terputus (misalnya karena refresh halaman)."
      />
    );
  }

  const winner = [...leaderboard].sort((a, b) => b.score - a.score)[0];

  function handleBackToHome() {
    resetRoom();
    navigate("/");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl font-bold uppercase tracking-wide text-cyber-text">
          Result
        </h1>
        <p className="text-sm text-cyber-dim">
          Room Code:{" "}
          <span className="font-mono text-cyber-text">{roomCode}</span>
        </p>
      </div>

      <div
        className="cyber-panel border p-5 text-center"
        style={{
          background: "var(--color-cyber-surface)",
          borderColor: "var(--color-cyber-yellow)",
        }}
      >
        <p className="cyber-label text-xs">◆ Winner ◆</p>
        <p className="font-display neon-yellow mt-1 text-2xl font-black text-cyber-yellow">
          {winner.username}
        </p>
        <p className="mt-1 font-mono text-sm text-cyber-dim">
          Skor: {winner.score}
        </p>
      </div>

      <Leaderboard rankings={leaderboard} title="Ranking" />

      <SummaryCard summaryText={summaryText} />

      <Button onClick={handleBackToHome} className="w-full">
        Kembali ke Home
      </Button>
    </div>
  );
}

export default Result;

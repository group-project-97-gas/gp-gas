const RANK_BADGE_CLASS = ["cyber-badge-1", "cyber-badge-2", "cyber-badge-3"];

function Leaderboard({ rankings, title = "Leaderboard" }) {
  const sorted = [...rankings].sort((a, b) => b.score - a.score);

  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-display text-base font-bold uppercase tracking-widest text-cyber-pink neon-pink">
        {title}
      </h2>
      <ul className="flex max-h-96 flex-col gap-2 overflow-y-auto">
        {sorted.map((entry, index) => (
          <li
            key={entry.username}
            className="cyber-card cyber-panel-sm flex min-w-0 items-center gap-3 p-3"
          >
            <span
              className={`cyber-badge flex h-7 w-7 shrink-0 items-center justify-center text-xs ${
                RANK_BADGE_CLASS[index] ?? "cyber-badge-default"
              }`}
            >
              {index + 1}
            </span>
            <span className="min-w-0 truncate font-medium">
              {entry.username}
            </span>
            <span className="ml-auto shrink-0 font-mono text-sm font-bold text-cyber-cyan">
              {entry.score}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Leaderboard;

import { Link } from "react-router";

function EmptyState({ title, description }) {
  return (
    <div className="flex flex-col items-center gap-3 border border-dashed border-cyber-border bg-cyber-surface/60 p-6 text-center">
      <p className="font-display text-sm font-bold uppercase tracking-widest text-cyber-pink neon-pink">
        {title}
      </p>
      {description && <p className="text-sm text-cyber-dim">{description}</p>}
      <Link
        to="/"
        className="cyber-btn cyber-btn-primary cyber-panel-sm mt-2 inline-flex min-h-11 items-center justify-center px-5 text-sm font-bold"
      >
        Kembali ke Home
      </Link>
    </div>
  );
}

export default EmptyState;

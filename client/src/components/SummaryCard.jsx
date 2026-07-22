import Spinner from "./Spinner.jsx";

function SummaryCard({ summaryText }) {
  return (
    <div
      className="cyber-panel flex flex-col gap-3 border p-4"
      style={{
        background: "var(--color-cyber-surface)",
        borderColor: "var(--color-cyber-purple)",
      }}
    >
      <h2
        className="font-display text-sm font-bold uppercase tracking-widest"
        style={{ color: "var(--color-cyber-purple)" }}
      >
        ▸ AI Summary
      </h2>
      {summaryText ? (
        <p className="font-mono text-sm leading-relaxed text-cyber-text">
          {summaryText}
        </p>
      ) : (
        <div className="flex items-center gap-3 text-sm text-cyber-dim">
          <Spinner
            size="sm"
            colorClassName="border-cyber-border border-t-cyber-purple"
          />
          <span>AI sedang membuat ringkasan performa, tunggu sebentar...</span>
        </div>
      )}
    </div>
  );
}

export default SummaryCard;

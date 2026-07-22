function ErrorBanner({ message }) {
  if (!message) {
    return null;
  }

  return (
    <div
      className="cyber-panel-sm flex items-start gap-2 border px-3 py-2 text-sm"
      style={{
        background: "rgba(255, 34, 71, 0.1)",
        borderColor: "var(--color-cyber-red)",
        color: "#ff8fa3",
        filter: "drop-shadow(0 0 6px rgba(255, 34, 71, 0.45))",
      }}
    >
      <span className="font-mono text-xs font-bold text-cyber-red">ERR//</span>
      <span>{message}</span>
    </div>
  );
}

export default ErrorBanner;

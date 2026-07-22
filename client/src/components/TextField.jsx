function TextField({ label, className = "", ...props }) {
  return (
    <label className="flex w-full flex-col gap-1.5 text-sm">
      <span className="cyber-label text-xs">{label}</span>
      <input
        className={`cyber-input cyber-panel-sm min-h-11 w-full px-3 py-2 text-base ${className}`}
        {...props}
      />
    </label>
  );
}

export default TextField;

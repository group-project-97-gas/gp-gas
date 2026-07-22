function SelectField({ label, className = "", children, ...props }) {
  return (
    <label className="flex w-full flex-col gap-1.5 text-sm">
      <span className="cyber-label text-xs">{label}</span>
      <select
        className={`cyber-input cyber-panel-sm min-h-11 w-full px-3 py-2 text-base ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export default SelectField;

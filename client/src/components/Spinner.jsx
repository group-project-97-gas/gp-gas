const SIZE_CLASSES = {
  sm: "h-5 w-5 border-2",
  md: "h-8 w-8 border-4",
};

function Spinner({
  size = "md",
  colorClassName = "border-cyber-border border-t-cyber-cyan",
  className = "",
}) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`animate-spin rounded-full ${SIZE_CLASSES[size]} ${colorClassName} ${className}`}
    />
  );
}

export default Spinner;

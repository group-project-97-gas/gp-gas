const VARIANT_CLASSES = {
  primary: "cyber-btn-primary",
  secondary: "cyber-btn-secondary",
};

function Button({
  variant = "primary",
  type = "button",
  className = "",
  ...props
}) {
  return (
    <button
      type={type}
      className={`cyber-btn cyber-panel-sm inline-flex min-h-11 items-center justify-center px-5 text-sm font-bold disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}

export default Button;

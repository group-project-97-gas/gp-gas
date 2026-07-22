import { useSocketStatus } from "../context/SocketContext.jsx";
import Spinner from "./Spinner.jsx";

function ConnectionBanner() {
  const { isReconnecting } = useSocketStatus();

  if (!isReconnecting) {
    return null;
  }

  return (
    <div
      className="flex items-center justify-center gap-3 border-b px-4 py-2 font-display text-xs font-bold uppercase tracking-widest"
      style={{
        background: "rgba(252, 238, 10, 0.12)",
        borderColor: "var(--color-cyber-yellow)",
        color: "var(--color-cyber-yellow)",
      }}
    >
      <Spinner
        size="sm"
        colorClassName="border-cyber-yellow/30 border-t-cyber-yellow"
      />
      <span>Koneksi Terputus // Menyambung Kembali...</span>
    </div>
  );
}

export default ConnectionBanner;

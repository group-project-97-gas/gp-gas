import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  if (!socketRef.current) {
    socketRef.current = io(import.meta.env.VITE_SERVER_URL, {
      autoConnect: false,
    });
  }

  const [isConnected, setIsConnected] = useState(false);
  // Tracks whether we've ever connected, so the reconnect banner only shows
  // for a real drop mid-session — not during the very first handshake.
  const [hasConnectedOnce, setHasConnectedOnce] = useState(false);

  useEffect(() => {
    const socket = socketRef.current;

    function handleConnect() {
      setIsConnected(true);
      setHasConnectedOnce(true);
    }

    function handleDisconnect() {
      setIsConnected(false);
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.connect();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{ socket: socketRef.current, isConnected, hasConnectedOnce }}
    >
      {children}
    </SocketContext.Provider>
  );
}

// Returns the raw socket instance, same as before — every existing emit/on
// call site keeps working unchanged.
export function useSocket() {
  return useContext(SocketContext).socket;
}

export function useSocketStatus() {
  const { isConnected, hasConnectedOnce } = useContext(SocketContext);
  return { isConnected, isReconnecting: hasConnectedOnce && !isConnected };
}

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useSocket } from "./SocketContext.jsx";

const RoomContext = createContext(null);

export function RoomProvider({ children }) {
  const socket = useSocket();

  const [roomCode, setRoomCode] = useState(null);
  const [username, setUsername] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [players, setPlayers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [summaryText, setSummaryText] = useState("");

  useEffect(() => {
    function handlePlayerJoined(payload) {
      setPlayers(payload.players);
    }

    function handleQuestion(payload) {
      setCurrentQuestion(payload);
    }

    function handleLeaderboard(payload) {
      setLeaderboard(payload.rankings);
    }

    function handleGameOver(payload) {
      setLeaderboard(payload.finalRankings);
    }

    function handleSummary(payload) {
      setSummaryText(payload.summaryText);
    }

    socket.on("player_joined", handlePlayerJoined);
    socket.on("question", handleQuestion);
    socket.on("next_question", handleQuestion);
    socket.on("leaderboard", handleLeaderboard);
    socket.on("game_over", handleGameOver);
    socket.on("summary", handleSummary);

    return () => {
      socket.off("player_joined", handlePlayerJoined);
      socket.off("question", handleQuestion);
      socket.off("next_question", handleQuestion);
      socket.off("leaderboard", handleLeaderboard);
      socket.off("game_over", handleGameOver);
      socket.off("summary", handleSummary);
    };
  }, [socket]);

  const resetRoom = useCallback(() => {
    setRoomCode(null);
    setUsername("");
    setIsHost(false);
    setPlayers([]);
    setQuestions([]);
    setCurrentQuestion(null);
    setLeaderboard([]);
    setSummaryText("");
  }, []);

  const value = {
    roomCode,
    setRoomCode,
    username,
    setUsername,
    isHost,
    setIsHost,
    players,
    setPlayers,
    questions,
    setQuestions,
    currentQuestion,
    setCurrentQuestion,
    leaderboard,
    setLeaderboard,
    summaryText,
    setSummaryText,
    resetRoom,
  };

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}

export function useRoom() {
  return useContext(RoomContext);
}

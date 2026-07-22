import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useRoom } from "../context/RoomContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";
import QuestionCard from "../components/QuestionCard.jsx";
import Leaderboard from "../components/Leaderboard.jsx";
import EmptyState from "../components/EmptyState.jsx";

// Cosmetic only — the server is the real authority on when a question ends
// (triviaHandlers.js's own QUESTION_TIME_LIMIT_SECONDS, currently 20s). Keep
// this in sync with that value so the client countdown doesn't mislead players.
const QUESTION_DURATION_SECONDS = 20;

// The server advances leaderboard -> next_question back-to-back with no pause,
// so without this the leaderboard would flash for only a few milliseconds.
// Hold it on screen for a bit so players can actually read it between questions.
const LEADERBOARD_DISPLAY_MS = 3000;

function Game() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const { currentQuestion, leaderboard } = useRoom();

  const [viewMode, setViewMode] = useState("question");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(QUESTION_DURATION_SECONDS);
  const nextQuestionTimeoutRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [currentQuestion]);

  useEffect(() => {
    function handleLeaderboard() {
      // Rankings themselves are synced into RoomContext.leaderboard there;
      // this listener only owns switching the local view.
      setViewMode("leaderboard");
    }

    function handleNextQuestion() {
      // currentQuestion in RoomContext already points at the new question, but
      // keep showing the leaderboard a bit longer so it's actually readable.
      if (nextQuestionTimeoutRef.current) {
        clearTimeout(nextQuestionTimeoutRef.current);
      }
      nextQuestionTimeoutRef.current = setTimeout(() => {
        setViewMode("question");
        setHasSubmitted(false);
        setSelectedAnswer(null);
        setTimeLeft(QUESTION_DURATION_SECONDS);
      }, LEADERBOARD_DISPLAY_MS);
    }

    function handleGameOver() {
      if (nextQuestionTimeoutRef.current) {
        clearTimeout(nextQuestionTimeoutRef.current);
      }
      navigate(`/result/${roomCode}`);
    }

    socket.on("leaderboard", handleLeaderboard);
    socket.on("next_question", handleNextQuestion);
    socket.on("game_over", handleGameOver);

    return () => {
      socket.off("leaderboard", handleLeaderboard);
      socket.off("next_question", handleNextQuestion);
      socket.off("game_over", handleGameOver);
      if (nextQuestionTimeoutRef.current) {
        clearTimeout(nextQuestionTimeoutRef.current);
      }
    };
  }, [socket, navigate, roomCode]);

  function handleAnswer(option) {
    if (hasSubmitted) {
      return;
    }
    setSelectedAnswer(option);
    setHasSubmitted(true);
    socket.emit("submit_answer", { roomCode, answer: option });
  }

  if (!currentQuestion) {
    return (
      <EmptyState
        title="Soal tidak ditemukan"
        description="Room ini mungkin sudah tidak aktif, atau sesi kamu terputus (misalnya karena refresh halaman). Silakan buat atau join room lagi."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {viewMode === "leaderboard" ? (
        <Leaderboard rankings={leaderboard} />
      ) : (
        <QuestionCard
          question={currentQuestion}
          onAnswer={handleAnswer}
          disabled={hasSubmitted}
          selectedAnswer={selectedAnswer}
          timeLeft={timeLeft}
        />
      )}
    </div>
  );
}

export default Game;

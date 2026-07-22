const OPTION_LABELS = ["A", "B", "C", "D"];

function QuestionCard({
  question,
  onAnswer,
  disabled,
  selectedAnswer,
  timeLeft,
}) {
  if (!question) {
    return null;
  }

  const isUrgent = timeLeft <= 5;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="cyber-label text-xs">
          Soal {question.questionNumber} / {question.totalQuestions}
        </span>
        <span
          className={`font-mono text-lg font-bold ${isUrgent ? "text-cyber-red neon-pink" : "text-cyber-cyan neon-cyan"}`}
        >
          {timeLeft}s
        </span>
      </div>

      <h2 className="font-display text-lg font-bold leading-snug text-cyber-text">
        {question.question}
      </h2>

      <div className="flex flex-col gap-2.5">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === option;
          return (
            <button
              key={option}
              type="button"
              disabled={disabled}
              onClick={() => onAnswer(option)}
              className={`cyber-panel-sm flex min-h-11 items-center gap-3 border p-3 text-left transition-colors disabled:cursor-not-allowed ${
                isSelected
                  ? "border-cyber-cyan bg-cyber-cyan/10"
                  : "border-cyber-border bg-cyber-surface enabled:hover:border-cyber-pink/60"
              } ${disabled && !isSelected ? "opacity-40" : ""}`}
              style={
                isSelected
                  ? { filter: "drop-shadow(0 0 8px rgba(5, 217, 232, 0.55))" }
                  : undefined
              }
            >
              <span
                className={`cyber-badge flex h-6 w-6 shrink-0 items-center justify-center text-xs ${
                  isSelected
                    ? "bg-cyber-cyan text-cyber-bg"
                    : "bg-cyber-surface-2 text-cyber-dim"
                }`}
              >
                {OPTION_LABELS[index]}
              </span>
              <span className="min-w-0 break-words text-cyber-text">
                {option}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default QuestionCard;

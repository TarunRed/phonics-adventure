import { useNavigate } from "react-router-dom";
import { useProgress } from "../../context/ProgressContext";
import { Button } from "../../components/shared/Button";
import { StarBadge } from "../../components/shared/StarBadge";
import styles from "./SessionSummary.module.css";

const SUCCESS_ACCURACY = 90;
const SUCCESS_WORDS = 20;

export function SessionSummary() {
  const navigate = useNavigate();
  const { stars, accuracy, wordsMastered, wordsAttempted, recommendation, resetSession } = useProgress();

  const succeeded = accuracy >= SUCCESS_ACCURACY || wordsMastered.length >= SUCCESS_WORDS;

  const playAgain = () => {
    resetSession();
    navigate("/");
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <span className={styles.badge}>{succeeded ? "🏆" : "🌱"}</span>
        <h1>{succeeded ? "Amazing work!" : "Great effort!"}</h1>
        <div className={styles.starRow}>
          <StarBadge stars={stars} />
        </div>

        <div className={styles.statGrid}>
          <div className={styles.stat}>
            <span className={styles.value}>{accuracy}%</span>
            <span className={styles.label}>Accuracy</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.value}>{wordsMastered.length}</span>
            <span className={styles.label}>Words mastered</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.value}>{wordsAttempted}</span>
            <span className={styles.label}>Words practised</span>
          </div>
        </div>

        {wordsMastered.length > 0 && (
          <div className={styles.wordList}>
            {wordsMastered.map((w) => (
              <span key={w} className={styles.wordChip}>
                {w}
              </span>
            ))}
          </div>
        )}

        <div className={styles.suggestion}>
          <span>👉</span>
          <p>{recommendation}</p>
        </div>

        <div className={styles.actions}>
          <Button variant="primary" size="lg" onClick={playAgain}>
            Play Again
          </Button>
        </div>
      </div>
    </div>
  );
}

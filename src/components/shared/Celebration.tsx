import { useEffect, useMemo } from "react";
import styles from "./Celebration.module.css";

interface CelebrationProps {
  message?: string;
  onDone: () => void;
}

const PIECES = 18;

/** Full-screen "5 stars!" celebration. No coins/gems per the PRD — just stars and joy. */
export function Celebration({ message = "5 Stars!", onDone }: CelebrationProps) {
  const confetti = useMemo(
    () =>
      Array.from({ length: PIECES }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.4,
        emoji: ["⭐", "🌟", "✨"][i % 3],
      })),
    []
  );

  useEffect(() => {
    const timer = setTimeout(onDone, 2200);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className={styles.overlay} onClick={onDone} role="status" aria-live="polite">
      {confetti.map((piece) => (
        <span
          key={piece.id}
          className={styles.piece}
          style={{ left: `${piece.left}%`, animationDelay: `${piece.delay}s` }}
        >
          {piece.emoji}
        </span>
      ))}
      <div className={styles.card}>
        <div className={styles.big}>🎉</div>
        <h2>{message}</h2>
        <p>You're doing amazing!</p>
      </div>
    </div>
  );
}

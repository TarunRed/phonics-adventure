import { useEffect } from "react";
import { useSpeechRecognizer } from "../../hooks/useSpeechRecognizer";
import styles from "./RecordButton.module.css";

interface RecordButtonProps {
  /** The word being checked. Never shown as text — only used to grade what was heard. */
  targetWord: string;
}

/**
 * Lets a child say the target word out loud and tells them whether it was
 * heard correctly — a pronunciation check, not just record-and-playback.
 * Deliberately shows no text spelling out the word, so it doesn't give
 * away answers in games where the word is still meant to be a secret.
 */
export function RecordButton({ targetWord }: RecordButtonProps) {
  const { state, listen, reset } = useSpeechRecognizer();

  // Reset whenever the round changes (targetWord differs) so stale
  // correct/incorrect feedback doesn't linger into the next question.
  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetWord]);

  if (state === "unsupported") return null;

  return (
    <div className={styles.wrap}>
      {state === "idle" && (
        <>
          <button type="button" className={styles.recordButton} onClick={() => listen(targetWord)} aria-label={`Say "${targetWord}" to check yourself`}>
            🎤
          </button>
          <p className={styles.hint}>Try saying it!</p>
        </>
      )}

      {state === "listening" && (
        <>
          <button type="button" className={[styles.recordButton, styles.recording].join(" ")} disabled aria-label="Listening">
            🎤
          </button>
          <p className={styles.hint}>Listening…</p>
        </>
      )}

      {state === "checking" && (
        <>
          <button type="button" className={styles.recordButton} disabled aria-label="Checking">
            🎤
          </button>
          <p className={styles.hint}>Checking…</p>
        </>
      )}

      {state === "correct" && (
        <div className={styles.result}>
          <span className={styles.correctIcon}>✅</span>
          <p className={styles.correctText}>Nice pronunciation!</p>
          <button type="button" className={styles.againButton} onClick={() => listen(targetWord)} aria-label="Try again">
            🔁
          </button>
        </div>
      )}

      {state === "incorrect" && (
        <div className={styles.result}>
          <span className={styles.incorrectIcon}>🔁</span>
          <p className={styles.incorrectText}>Give it another try.</p>
          <button type="button" className={styles.againButton} onClick={() => listen(targetWord)} aria-label="Try again">
            🎤
          </button>
        </div>
      )}

      {state === "error" && (
        <div className={styles.result}>
          <p className={styles.incorrectText}>Didn't catch that.</p>
          <button type="button" className={styles.retryButton} onClick={() => listen(targetWord)}>
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

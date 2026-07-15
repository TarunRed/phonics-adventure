import { useEffect, useRef, useState } from "react";
import { useSpeechRecognizer } from "../../hooks/useSpeechRecognizer";
import { speak } from "../../utils/speech";
import { Button } from "./Button";
import styles from "./PronunciationCheck.module.css";

const MAX_BASIC_ATTEMPTS = 3;
const MAX_TOTAL_ATTEMPTS = 5;
const AUTO_ADVANCE_DELAY_MS = 1400;

interface PronunciationCheckProps {
  /** What the child needs to say — also what gets shown as text (never hidden here). */
  target: string;
  instruction: string;
  onContinue: () => void;
  continueLabel?: string;
}

/**
 * An in-game "say it and check" step: record, get instant Correct/Try again
 * feedback from the browser's speech recognition, then continue.
 *
 * Retry ladder: 3 tries on their own; if still wrong, the app reads the
 * target aloud and gives 2 more tries; if it's still wrong after 5 total
 * attempts, it moves on automatically so no one gets stuck. Getting it
 * right at any point still needs a manual tap to continue, so the win
 * feels earned rather than auto-skipped past.
 */
export function PronunciationCheck({ target, instruction, onContinue, continueLabel = "Continue" }: PronunciationCheckProps) {
  const { state, listen, stop, reset } = useSpeechRecognizer();
  const [attemptCount, setAttemptCount] = useState(0);
  const onContinueRef = useRef(onContinue);
  onContinueRef.current = onContinue;

  useEffect(() => {
    reset();
    setAttemptCount(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  // Auto-skip entirely if this browser can't do speech recognition at all —
  // there's nothing for the child to do with a mic button that can't listen.
  useEffect(() => {
    if (state === "unsupported") onContinueRef.current();
  }, [state]);

  // Count each completed attempt (correct, incorrect, or a recognition error).
  useEffect(() => {
    if (state === "correct" || state === "incorrect" || state === "error") {
      setAttemptCount((prev) => prev + 1);
    }
  }, [state]);

  // React to the attempt count: read the word aloud after 3 misses, and
  // move on automatically after 5 without ever getting it right.
  useEffect(() => {
    if (attemptCount === 0 || state === "correct") return;
    if (attemptCount === MAX_BASIC_ATTEMPTS) {
      speak(target);
    }
    if (attemptCount >= MAX_TOTAL_ATTEMPTS) {
      const timer = setTimeout(() => onContinueRef.current(), AUTO_ADVANCE_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [attemptCount, state, target]);

  const attempted = state === "correct" || state === "incorrect" || state === "error";
  const gaveUp = attemptCount >= MAX_TOTAL_ATTEMPTS && state !== "correct";
  const justGotHelp = attemptCount === MAX_BASIC_ATTEMPTS && state !== "correct";

  return (
    <div className={styles.wrap}>
      <p className={styles.instruction}>{instruction}</p>
      <p className={styles.targetText}>{target.toLowerCase()}</p>

      {!gaveUp && state === "idle" && (
        <button type="button" className={styles.micButton} onClick={() => listen(target)} aria-label={`Start recording: say "${target}"`}>
          🎤
        </button>
      )}

      {!gaveUp && state === "listening" && (
        <button type="button" className={[styles.micButton, styles.recording].join(" ")} onClick={stop} aria-label="Stop recording">
          ⏹
        </button>
      )}
      {!gaveUp && state === "listening" && <p className={styles.hint}>Recording… tap to stop</p>}
      {!gaveUp && state === "checking" && <p className={styles.hint}>Checking…</p>}

      {state === "correct" && <p className={styles.correctText}>✅ Nice pronunciation!</p>}
      {!gaveUp && (state === "incorrect" || state === "error") && (
        <p className={styles.incorrectText}>{justGotHelp ? "👂 Listen, then try again!" : "🔁 Keep practising!"}</p>
      )}
      {gaveUp && <p className={styles.incorrectText}>Good try! Let's keep going.</p>}

      <div className={styles.actions}>
        {!gaveUp && attempted && state !== "correct" && (
          <button type="button" className={styles.retryButton} onClick={() => listen(target)} aria-label="Try again">
            🎤 Try again
          </button>
        )}
        {state === "correct" && (
          <Button variant="success" size="md" onClick={onContinue}>
            {continueLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

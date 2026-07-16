import { useEffect, useRef, useState } from "react";
import { useSpeechRecognizer } from "../../hooks/useSpeechRecognizer";
import { speak } from "../../utils/speech";
import { Button } from "./Button";
import styles from "./PronunciationCheck.module.css";

const MAX_BASIC_ATTEMPTS = 3;
const MAX_TOTAL_ATTEMPTS = 5;
const AUTO_ADVANCE_DELAY_MS = 1400;

interface PronunciationCheckProps {
  /** What the child needs to say, and what gets matched against speech recognition. */
  target: string;
  /** What's shown on screen for `target` — defaults to target itself (lowercased). */
  displayText?: string;
  instruction: string;
  onContinue: () => void;
  continueLabel?: string;
  /** How to pronounce `target` — used for both the on-demand "Hear it" button and the
   *  3-miss read-aloud. Defaults to speaking it as-is; pass a custom sound (e.g.
   *  stretched letter sounds) to override for both. */
  onReadAloud?: () => void;
}

/**
 * An in-game "say it and check" step, with four explicit stages the child
 * controls: Start Recording -> Stop Recording -> Submit -> see the result.
 * Stopping doesn't grade anything by itself — the recognizer has an answer
 * ready internally, but it stays hidden until Submit is tapped, so nothing
 * is revealed until the child chooses to check it.
 *
 * Retry ladder: 3 submitted tries on their own; if still wrong, the app
 * reads the target aloud and gives 2 more; if it's still wrong after 5
 * total submissions, it moves on automatically so no one gets stuck.
 * Getting it right still needs a manual tap to continue, so the win feels
 * earned rather than auto-skipped past.
 */
export function PronunciationCheck({
  target,
  displayText,
  instruction,
  onContinue,
  continueLabel = "Continue",
  onReadAloud,
}: PronunciationCheckProps) {
  const { state, listen, stop, reset } = useSpeechRecognizer();
  const [attemptCount, setAttemptCount] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const onContinueRef = useRef(onContinue);
  onContinueRef.current = onContinue;
  const onReadAloudRef = useRef(onReadAloud);
  onReadAloudRef.current = onReadAloud;

  const playTarget = () => {
    if (onReadAloudRef.current) onReadAloudRef.current();
    else speak(target);
  };

  useEffect(() => {
    reset();
    setAttemptCount(0);
    setSubmitted(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  // Auto-skip entirely if this browser can't do speech recognition at all —
  // there's nothing for the child to do with a mic button that can't listen.
  useEffect(() => {
    if (state === "unsupported") onContinueRef.current();
  }, [state]);

  // React to the (submitted) attempt count: read the word aloud after 3
  // misses, and move on automatically after 5 without ever getting it right.
  useEffect(() => {
    if (attemptCount === 0 || state === "correct") return;
    if (attemptCount === MAX_BASIC_ATTEMPTS) {
      if (onReadAloudRef.current) onReadAloudRef.current();
      else speak(target);
    }
    if (attemptCount >= MAX_TOTAL_ATTEMPTS) {
      const timer = setTimeout(() => onContinueRef.current(), AUTO_ADVANCE_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [attemptCount, state, target]);

  const graded = state === "correct" || state === "incorrect" || state === "error";
  const readyToSubmit = graded && !submitted;
  const revealed = graded && submitted;
  const gaveUp = attemptCount >= MAX_TOTAL_ATTEMPTS && state !== "correct";
  const justGotHelp = attemptCount === MAX_BASIC_ATTEMPTS && state !== "correct";

  const handleSubmit = () => {
    setSubmitted(true);
    setAttemptCount((prev) => prev + 1);
  };

  const handleRecordAgain = () => {
    setSubmitted(false);
    listen(target);
  };

  return (
    <div className={styles.wrap}>
      <p className={styles.instruction}>{instruction}</p>
      <div className={styles.targetRow}>
        <p className={styles.targetText}>{displayText ?? target.toLowerCase()}</p>
        <button type="button" className={styles.hearButton} onClick={playTarget} aria-label="Hear it">
          🔈
        </button>
      </div>

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

      {!gaveUp && readyToSubmit && <p className={styles.hint}>Got it! Ready to check your answer?</p>}

      {revealed && state === "correct" && <p className={styles.correctText}>✅ Nice pronunciation!</p>}
      {revealed && !gaveUp && (state === "incorrect" || state === "error") && (
        <p className={styles.incorrectText}>{justGotHelp ? "👂 Listen, then try again!" : "🔁 Keep practising!"}</p>
      )}
      {gaveUp && <p className={styles.incorrectText}>Good try! Let's keep going.</p>}

      <div className={styles.actions}>
        {!gaveUp && readyToSubmit && (
          <Button variant="success" size="md" onClick={handleSubmit}>
            Submit
          </Button>
        )}
        {!gaveUp && revealed && state !== "correct" && (
          <button type="button" className={styles.retryButton} onClick={handleRecordAgain} aria-label="Try again">
            🎤 Try again
          </button>
        )}
        {revealed && state === "correct" && (
          <Button variant="success" size="md" onClick={onContinue}>
            {continueLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

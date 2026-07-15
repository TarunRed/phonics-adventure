import { useEffect } from "react";
import { useSpeechRecognizer } from "../../hooks/useSpeechRecognizer";
import { Button } from "./Button";
import styles from "./PronunciationCheck.module.css";

interface PronunciationCheckProps {
  /** What the child needs to say — also what gets shown as text (never hidden here). */
  target: string;
  instruction: string;
  onContinue: () => void;
  continueLabel?: string;
}

/**
 * An in-game "say it and check" step: record, get instant Correct/Try again
 * feedback from the browser's speech recognition, then continue. Unlike the
 * ambient RecordButton, this is a required step within a game's own flow
 * (e.g. Spin the Wheel's blend-sound and whole-word checks) rather than an
 * optional side control, so it always offers a way forward even if speech
 * recognition can't confirm the pronunciation — flaky recognition shouldn't
 * be able to trap a child mid-game.
 */
export function PronunciationCheck({ target, instruction, onContinue, continueLabel = "Continue" }: PronunciationCheckProps) {
  const { state, listen, reset } = useSpeechRecognizer();

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const attempted = state === "correct" || state === "incorrect" || state === "error";

  return (
    <div className={styles.wrap}>
      <p className={styles.instruction}>{instruction}</p>
      <p className={styles.targetText}>{target.toLowerCase()}</p>

      {state === "idle" && (
        <button type="button" className={styles.micButton} onClick={() => listen(target)} aria-label={`Say "${target}"`}>
          🎤
        </button>
      )}

      {state === "listening" && (
        <button type="button" className={[styles.micButton, styles.recording].join(" ")} disabled aria-label="Listening">
          🎤
        </button>
      )}
      {state === "listening" && <p className={styles.hint}>Listening…</p>}
      {state === "checking" && <p className={styles.hint}>Checking…</p>}

      {state === "correct" && <p className={styles.correctText}>✅ Nice pronunciation!</p>}
      {(state === "incorrect" || state === "error") && <p className={styles.incorrectText}>🔁 Keep practising!</p>}

      <div className={styles.actions}>
        {attempted && (
          <button type="button" className={styles.retryButton} onClick={() => listen(target)} aria-label="Try again">
            🎤 Try again
          </button>
        )}
        {(attempted || state === "unsupported") && (
          <Button variant="success" size="md" onClick={onContinue}>
            {continueLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

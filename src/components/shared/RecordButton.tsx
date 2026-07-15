import { useRef } from "react";
import { useRecorder } from "../../hooks/useRecorder";
import styles from "./RecordButton.module.css";

interface RecordButtonProps {
  /** What the child is being asked to say, shown as a small caption. */
  prompt?: string;
}

/** Lets a child record their own voice and immediately hear it played back. */
export function RecordButton({ prompt }: RecordButtonProps) {
  const { state, audioUrl, errorMessage, start, stop, reset } = useRecorder();
  const audioRef = useRef<HTMLAudioElement>(null);

  const playback = () => {
    audioRef.current?.play();
  };

  return (
    <div className={styles.wrap}>
      {prompt && state === "idle" && <p className={styles.prompt}>Say "{prompt}"</p>}

      {state === "idle" && (
        <button type="button" className={styles.recordButton} onClick={start} aria-label="Record your voice">
          🎤
        </button>
      )}

      {state === "requesting" && (
        <button type="button" className={styles.recordButton} disabled aria-label="Requesting microphone">
          🎤
        </button>
      )}

      {state === "recording" && (
        <button type="button" className={[styles.recordButton, styles.recording].join(" ")} onClick={stop} aria-label="Stop recording">
          ⏹
        </button>
      )}

      {state === "recording" && <p className={styles.hint}>Recording… tap to stop</p>}

      {state === "recorded" && audioUrl && (
        <div className={styles.playbackRow}>
          <button type="button" className={styles.playButton} onClick={playback} aria-label="Play your recording">
            ▶️
          </button>
          <button type="button" className={styles.againButton} onClick={reset} aria-label="Record again">
            🔁
          </button>
          <audio ref={audioRef} src={audioUrl} />
        </div>
      )}

      {state === "error" && (
        <div className={styles.errorBox}>
          <p>{errorMessage}</p>
          <button type="button" className={styles.retryButton} onClick={reset}>
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

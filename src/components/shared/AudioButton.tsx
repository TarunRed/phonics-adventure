import { useState } from "react";
import { speak } from "../../utils/speech";
import styles from "./AudioButton.module.css";

interface AudioButtonProps {
  text: string;
  label?: string;
  size?: "lg" | "md" | "sm";
  rate?: number;
  onPlay?: () => void;
}

/** The "Play" speaker button used everywhere a word/sound needs to be heard. */
export function AudioButton({ text, label = "Listen", size = "md", rate, onPlay }: AudioButtonProps) {
  const [playing, setPlaying] = useState(false);

  const handlePlay = () => {
    onPlay?.();
    setPlaying(true);
    speak(text, { rate, onEnd: () => setPlaying(false) });
  };

  return (
    <button
      type="button"
      className={[styles.button, styles[size], playing ? styles.playing : ""].join(" ")}
      onClick={handlePlay}
      aria-label={label}
    >
      {playing ? "🔊" : "🔈"}
    </button>
  );
}

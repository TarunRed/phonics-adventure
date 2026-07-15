import type { GameId } from "../../types";
import { getLevelByGame } from "../../utils/phonicsData";
import styles from "./HowToPlayModal.module.css";

/**
 * Short, plain-language rules per game — modelled on phonicsandstuff.com's
 * "How to Play" panel: a couple of numbered steps, no jargon.
 */
const INSTRUCTIONS: Record<GameId, string[]> = {
  BlendExplorer: [
    "Tap each letter to hear its sound.",
    'Tap "Blend them!" to combine the letters, then tap again to build the whole word.',
    "Pick the picture that matches the word.",
  ],
  SpinWheel: [
    'Tap "Spin the Wheel!" to spin.',
    "When it stops, tap 🎤 and say the blend sound to check yourself.",
    "Tap the picture whose word starts with that blend.",
    "Finally, read and say the whole word out loud to finish.",
  ],
  BuildWord: [
    "Tap the letter tiles, in order, to fill the blanks and spell the word.",
    "Get it wrong and the tiles reset — just try again.",
  ],
  DragPicture: ["A word is shown on screen.", "Tap the picture that matches it."],
  ReadingChallenge: ["Read the word, or tap 🔈 to hear it.", "Tap the picture that matches the word."],
  WordFamilyCards: [
    "A picture and a word ending are shown.",
    "Tap the blend that completes the word.",
    "Get it right and the whole word appears!",
  ],
};

interface HowToPlayModalProps {
  game: GameId;
  onClose: () => void;
}

export function HowToPlayModal({ game, onClose }: HowToPlayModalProps) {
  const level = getLevelByGame(game);
  const steps = INSTRUCTIONS[game];

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-label="How to play">
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close instructions">
          ✕
        </button>

        <h2 className={styles.title}>How to Play</h2>
        <p className={styles.gameName}>
          <span>{level.icon}</span> {level.gameName}
        </p>

        <ol className={styles.steps}>
          {steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>

        <p className={styles.footer}>Get it right and earn a ⭐ — tap 🎤 anytime to check your pronunciation.</p>
      </div>
    </div>
  );
}

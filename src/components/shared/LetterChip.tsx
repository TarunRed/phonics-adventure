import styles from "./LetterChip.module.css";

interface LetterChipProps {
  letter: string;
  onClick?: () => void;
  filled?: boolean;
  empty?: boolean;
  state?: "idle" | "correct" | "incorrect";
}

/** A single big letter tile — used both as a draggable/tappable source tile and as a slot. */
export function LetterChip({ letter, onClick, filled, empty, state = "idle" }: LetterChipProps) {
  const classes = [styles.chip, empty ? styles.empty : "", filled ? styles.filled : "", styles[state]]
    .filter(Boolean)
    .join(" ");
  return (
    <button type="button" className={classes} onClick={onClick} disabled={!onClick}>
      {empty ? "" : letter.toUpperCase()}
    </button>
  );
}

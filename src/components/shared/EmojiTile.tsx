import styles from "./EmojiTile.module.css";

interface EmojiTileProps {
  emoji: string;
  label?: string;
  selected?: boolean;
  state?: "idle" | "correct" | "incorrect";
  onClick?: () => void;
  size?: "lg" | "md";
}

/** A big tappable tile showing an emoji picture — the "picture" half of picture-matching games. */
export function EmojiTile({ emoji, label, selected, state = "idle", onClick, size = "lg" }: EmojiTileProps) {
  const classes = [styles.tile, styles[size], selected ? styles.selected : "", styles[state]]
    .filter(Boolean)
    .join(" ");

  return (
    <button type="button" className={classes} onClick={onClick} disabled={!onClick} aria-label={label ?? emoji}>
      <span className={styles.emoji}>{emoji}</span>
      {label && <span className={styles.label}>{label}</span>}
    </button>
  );
}

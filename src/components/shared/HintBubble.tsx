import styles from "./HintBubble.module.css";

interface HintBubbleProps {
  message: string;
  tone?: "encourage" | "hint";
}

/** Friendly mascot-style speech bubble used to deliver the escalating hint messages. */
export function HintBubble({ message, tone = "encourage" }: HintBubbleProps) {
  return (
    <div className={[styles.bubble, styles[tone]].join(" ")} role="status" aria-live="polite">
      <span className={styles.face}>{tone === "encourage" ? "🦉" : "💡"}</span>
      <p>{message}</p>
    </div>
  );
}

import styles from "./ProgressDots.module.css";

export function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className={styles.dots} aria-label={`Question ${current + 1} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={[styles.dot, i < current ? styles.done : "", i === current ? styles.active : ""].join(" ")} />
      ))}
    </div>
  );
}

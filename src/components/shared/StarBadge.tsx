import styles from "./StarBadge.module.css";

export function StarBadge({ stars }: { stars: number }) {
  return (
    <div className={styles.badge} aria-label={`${stars} stars earned`}>
      <span className={styles.star}>⭐</span>
      <span className={styles.count}>{stars}</span>
    </div>
  );
}

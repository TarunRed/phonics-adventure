import { useProgress } from "../../context/ProgressContext";
import { Header } from "../../components/shared/Header";
import styles from "./Parent.module.css";

function formatMinutes(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export function Parent() {
  const { accuracy, wordsAttempted, wordsMastered, blendAccuracy, timePlayedMs, recommendation, teacherSettings } = useProgress();

  const currentBlend = Object.keys(blendAccuracy).at(-1) ?? teacherSettings.blend ?? "—";

  return (
    <div className={styles.page}>
      <Header title="Parent Dashboard" showStars={false} />

      <div className={styles.content}>
        <div className={styles.statGrid}>
          <div className={styles.stat}>
            <span className={styles.value}>{accuracy}%</span>
            <span className={styles.label}>Accuracy</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.value}>{wordsAttempted}</span>
            <span className={styles.label}>Words attempted</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.value}>{wordsMastered.length}</span>
            <span className={styles.label}>Words mastered</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.value}>{currentBlend}</span>
            <span className={styles.label}>Current blend</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.value}>{teacherSettings.level}</span>
            <span className={styles.label}>Current level</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.value}>{formatMinutes(timePlayedMs)}</span>
            <span className={styles.label}>Time played</span>
          </div>
        </div>

        <section className={styles.section}>
          <h3>Words mastered this session</h3>
          {wordsMastered.length === 0 ? (
            <p className={styles.empty}>No words mastered yet — start a session to see progress here.</p>
          ) : (
            <div className={styles.wordList}>
              {wordsMastered.map((w) => (
                <span key={w} className={styles.wordChip}>
                  {w}
                </span>
              ))}
            </div>
          )}
        </section>

        <section className={styles.section}>
          <h3>Accuracy by blend</h3>
          {Object.keys(blendAccuracy).length === 0 ? (
            <p className={styles.empty}>Play a session to see per-blend accuracy.</p>
          ) : (
            <div className={styles.blendList}>
              {Object.entries(blendAccuracy).map(([blend, stat]) => (
                <div key={blend} className={styles.blendRow}>
                  <span className={styles.blendLabel}>{blend}</span>
                  <div className={styles.barTrack}>
                    <div className={styles.barFill} style={{ width: `${Math.round((stat.correct / stat.total) * 100)}%` }} />
                  </div>
                  <span className={styles.blendPct}>{Math.round((stat.correct / stat.total) * 100)}%</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={[styles.section, styles.recommendation].join(" ")}>
          <h3>Recommendation</h3>
          <p>{recommendation}</p>
        </section>

        <p className={styles.disclaimer}>
          This app has no backend — these stats reflect only the current browser session and will reset on refresh.
        </p>
      </div>
    </div>
  );
}

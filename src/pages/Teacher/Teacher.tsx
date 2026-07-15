import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProgress } from "../../context/ProgressContext";
import { allBlends, allLevels, getWordsByBlend } from "../../utils/phonicsData";
import { Header } from "../../components/shared/Header";
import { Button } from "../../components/shared/Button";
import type { PlayConfig } from "../Play/Play";
import styles from "./Teacher.module.css";

export function Teacher() {
  const navigate = useNavigate();
  const { teacherSettings, updateTeacherSettings } = useProgress();
  const [homeworkAssigned, setHomeworkAssigned] = useState<string | null>(null);

  const families = teacherSettings.blend
    ? [...new Set(getWordsByBlend(teacherSettings.blend).map((w) => w.family))].sort()
    : [];

  const level = allLevels.find((l) => l.id === teacherSettings.level) ?? allLevels[0];

  const startGuidedSession = () => {
    const config: Partial<PlayConfig> = {
      blend: teacherSettings.blend,
      family: teacherSettings.family,
      onlyGame: teacherSettings.guidedMode ? level.game : null,
      roundCount: 8,
      hintsEnabled: teacherSettings.enableHints,
      hideTimer: teacherSettings.hideTimer,
    };
    navigate("/play", { state: config });
  };

  const assignHomework = (blendId: string) => {
    updateTeacherSettings({ homeworkBlend: blendId });
    setHomeworkAssigned(blendId);
  };

  return (
    <div className={styles.page}>
      <Header title="Teacher Mode" showStars={false} />

      <div className={styles.content}>
        <section className={styles.section}>
          <h3>Choose a blend</h3>
          <div className={styles.chipRow}>
            {allBlends.map((b) => (
              <button
                key={b.id}
                className={[styles.chip, teacherSettings.blend === b.id ? styles.chipActive : ""].join(" ")}
                style={teacherSettings.blend === b.id ? { background: b.colour, color: "white" } : {}}
                onClick={() => updateTeacherSettings({ blend: b.id, family: null })}
              >
                {b.id}
              </button>
            ))}
            <button
              className={[styles.chip, teacherSettings.blend === null ? styles.chipActive : ""].join(" ")}
              onClick={() => updateTeacherSettings({ blend: null, family: null })}
            >
              All blends
            </button>
          </div>
        </section>

        {families.length > 0 && (
          <section className={styles.section}>
            <h3>Choose a word family</h3>
            <div className={styles.chipRow}>
              <button
                className={[styles.chip, teacherSettings.family === null ? styles.chipActive : ""].join(" ")}
                onClick={() => updateTeacherSettings({ family: null })}
              >
                All families
              </button>
              {families.map((f) => (
                <button
                  key={f}
                  className={[styles.chip, teacherSettings.family === f ? styles.chipActive : ""].join(" ")}
                  onClick={() => updateTeacherSettings({ family: f })}
                >
                  -{f}
                </button>
              ))}
            </div>
          </section>
        )}

        <section className={styles.section}>
          <h3>Choose a level</h3>
          <div className={styles.levelGrid}>
            {allLevels.map((l) => (
              <button
                key={l.id}
                className={[styles.levelCard, teacherSettings.level === l.id ? styles.levelActive : ""].join(" ")}
                onClick={() => updateTeacherSettings({ level: l.id })}
              >
                <span className={styles.levelIcon}>{l.icon}</span>
                <span className={styles.levelName}>{l.name}</span>
              </button>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h3>Session options</h3>
          <div className={styles.toggles}>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={teacherSettings.guidedMode}
                onChange={(e) => updateTeacherSettings({ guidedMode: e.target.checked })}
              />
              Guided mode (only play the chosen level's game)
            </label>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={teacherSettings.hideTimer}
                onChange={(e) => updateTeacherSettings({ hideTimer: e.target.checked })}
              />
              Hide timer
            </label>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={teacherSettings.enableHints}
                onChange={(e) => updateTeacherSettings({ enableHints: e.target.checked })}
              />
              Enable hints
            </label>
          </div>
        </section>

        <section className={styles.section}>
          <h3>Assign homework</h3>
          <div className={styles.chipRow}>
            {allBlends.map((b) => (
              <button
                key={b.id}
                className={[styles.chip, teacherSettings.homeworkBlend === b.id ? styles.chipActive : ""].join(" ")}
                onClick={() => assignHomework(b.id)}
              >
                {b.id}
              </button>
            ))}
          </div>
          {homeworkAssigned && <p className={styles.confirm}>Homework assigned: Practice {homeworkAssigned} tonight.</p>}
        </section>

        <Button variant="primary" size="lg" onClick={startGuidedSession}>
          Start Guided Session
        </Button>
      </div>
    </div>
  );
}

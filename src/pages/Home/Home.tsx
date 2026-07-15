import { useNavigate } from "react-router-dom";
import { allBlends, randomBlendId } from "../../utils/phonicsData";
import { Button } from "../../components/shared/Button";
import type { PlayConfig } from "../Play/Play";
import styles from "./Home.module.css";

export function Home() {
  const navigate = useNavigate();

  const startIndependent = () => {
    const config: Partial<PlayConfig> = {
      blend: randomBlendId(),
      family: null,
      onlyGame: null,
      roundCount: 10,
      hintsEnabled: true,
      hideTimer: false,
    };
    navigate("/play", { state: config });
  };

  const startBlend = (blendId: string) => {
    navigate(`/blend/${blendId}`);
  };

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <span className={styles.mascot}>🦉</span>
        <h1 className={styles.title}>Phonics Adventure</h1>
        <p className={styles.subtitle}>S Blend Explorer</p>
      </div>

      <Button variant="primary" size="lg" icon="▶️" onClick={startIndependent}>
        Play
      </Button>

      <p className={styles.blendCaption}>Or pick a blend to choose a game:</p>
      <div className={styles.blendGrid}>
        {allBlends.map((blend) => (
          <button
            key={blend.id}
            className={styles.blendTile}
            style={{ background: blend.colour }}
            onClick={() => startBlend(blend.id)}
          >
            <span className={styles.blendLetters}>{blend.id}</span>
            <span className={styles.blendWord}>{blend.exampleWord}</span>
          </button>
        ))}
      </div>

      <div className={styles.footerNav}>
        <Button variant="ghost" size="sm" onClick={() => navigate("/teacher")}>
          👩‍🏫 Teacher Mode
        </Button>
        <Button variant="ghost" size="sm" onClick={() => navigate("/parent")}>
          👪 Parent Dashboard
        </Button>
      </div>
    </div>
  );
}

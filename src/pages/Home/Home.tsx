import { useNavigate } from "react-router-dom";
import { allLevels } from "../../utils/phonicsData";
import { Button } from "../../components/shared/Button";
import type { PlayConfig } from "../Play/Play";
import styles from "./Home.module.css";

export function Home() {
  const navigate = useNavigate();

  const startIndependent = () => {
    const config: Partial<PlayConfig> = {
      blend: null,
      family: null,
      onlyGame: null,
      roundCount: 10,
      hintsEnabled: true,
      hideTimer: false,
    };
    navigate("/play", { state: config });
  };

  const startGame = (game: PlayConfig["onlyGame"]) => {
    const config: Partial<PlayConfig> = {
      blend: null,
      family: null,
      onlyGame: game,
      roundCount: 10,
      hintsEnabled: true,
      hideTimer: false,
    };
    navigate("/play", { state: config });
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

      <p className={styles.gameCaption}>Or pick a game — practise every blend as you play:</p>
      <div className={styles.gameGrid}>
        {allLevels.map((level) => (
          <button
            key={level.id}
            className={styles.gameTile}
            style={{ background: level.colour }}
            onClick={() => startGame(level.game)}
          >
            <span className={styles.gameIcon}>{level.icon}</span>
            <span className={styles.gameName}>{level.gameName}</span>
            <span className={styles.gameTagline}>{level.gameTagline}</span>
          </button>
        ))}
      </div>

      <div className={styles.footerNav}>
        <Button variant="ghost" size="sm" onClick={() => navigate("/guide")}>
          📖 Sounds Guide
        </Button>
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

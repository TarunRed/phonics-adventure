import { useNavigate, useParams } from "react-router-dom";
import { allLevels, getBlend } from "../../utils/phonicsData";
import { Header } from "../../components/shared/Header";
import { AudioButton } from "../../components/shared/AudioButton";
import type { PlayConfig } from "../Play/Play";
import styles from "./BlendHub.module.css";

/**
 * Shown after a blend is picked from Home. Each blend gets its own set of
 * five separate games (rather than one session mixing all game types) —
 * picking a game here plays ONLY that game, repeatedly, for this blend.
 */
export function BlendHub() {
  const { blendId } = useParams<{ blendId: string }>();
  const navigate = useNavigate();
  const blend = getBlend(blendId ?? "SN");

  const startGame = (game: PlayConfig["onlyGame"]) => {
    const config: Partial<PlayConfig> = {
      blend: blend.id,
      family: null,
      onlyGame: game,
      roundCount: 8,
      hintsEnabled: true,
      hideTimer: false,
    };
    navigate("/play", { state: config });
  };

  return (
    <div className={styles.page}>
      <Header title={`Blend ${blend.id}`} showStars={false} />

      <div className={styles.hero} style={{ background: blend.colour }}>
        <span className={styles.letters}>{blend.id}</span>
        <span className={styles.example}>{blend.exampleWord}</span>
        <AudioButton text={blend.exampleWord} size="md" label={`Hear ${blend.exampleWord}`} />
      </div>

      <p className={styles.instructions}>Pick a game to practise the {blend.id} blend:</p>

      <div className={styles.gameGrid}>
        {allLevels.map((level) => (
          <button key={level.id} className={styles.gameCard} onClick={() => startGame(level.game)}>
            <span className={styles.gameIcon}>{level.icon}</span>
            <span className={styles.gameName}>{level.name}</span>
            <span className={styles.gameDesc}>{level.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

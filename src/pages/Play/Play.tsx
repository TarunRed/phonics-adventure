import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useProgress } from "../../context/ProgressContext";
import { buildSession, type Round } from "../../utils/sessionBuilder";
import { getBlend, getLevelByGame } from "../../utils/phonicsData";
import type { GameId } from "../../types";
import { Header } from "../../components/shared/Header";
import { ProgressDots } from "../../components/shared/ProgressDots";
import { Celebration } from "../../components/shared/Celebration";
import { RecordButton } from "../../components/shared/RecordButton";
import { BuildWord } from "../../components/games/BuildWord/BuildWord";
import { DragPicture } from "../../components/games/DragPicture/DragPicture";
import { SpinWheel } from "../../components/games/SpinWheel/SpinWheel";
import { ReadingChallenge } from "../../components/games/ReadingChallenge/ReadingChallenge";
import { BlendExplorer } from "../../components/games/BlendExplorer/BlendExplorer";
import styles from "./Play.module.css";

export interface PlayConfig {
  blend: string | null;
  family: string | null;
  onlyGame: GameId | null;
  roundCount: number;
  hintsEnabled: boolean;
  hideTimer: boolean;
}

const GAME_COMPONENTS: Record<GameId, typeof BuildWord> = {
  BuildWord,
  DragPicture,
  SpinWheel,
  ReadingChallenge,
  BlendExplorer,
};

const DEFAULT_CONFIG: PlayConfig = {
  blend: null,
  family: null,
  onlyGame: null,
  roundCount: 10,
  hintsEnabled: true,
  hideTimer: false,
};

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function Play() {
  const location = useLocation();
  const navigate = useNavigate();
  const { recordAttempt, resetSession, stars } = useProgress();

  const config: PlayConfig = { ...DEFAULT_CONFIG, ...(location.state as Partial<PlayConfig> | null) };

  const [rounds] = useState<Round[]>(() => buildSession(config));
  const [roundIndex, setRoundIndex] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const prevStars = useRef(0);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    resetSession();
    startedAt.current = Date.now();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (config.hideTimer) return;
    const interval = setInterval(() => setElapsedMs(Date.now() - startedAt.current), 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.hideTimer]);

  const round = rounds[roundIndex];
  const blend = useMemo(() => getBlend(round.words[0].blend), [round]);
  const level = useMemo(() => getLevelByGame(round.game), [round.game]);
  const GameComponent = GAME_COMPONENTS[round.game];

  const handleResult = (correct: boolean, word: (typeof round.words)[number], tries: number) => {
    recordAttempt(word, round.game, correct, tries);

    const newStars = stars + (correct ? 1 : 0);
    const crossedMilestone = correct && newStars > 0 && newStars % 5 === 0 && newStars !== prevStars.current;
    prevStars.current = newStars;

    const goNext = () => {
      if (roundIndex + 1 >= rounds.length) {
        navigate("/summary");
      } else {
        setRoundIndex((i) => i + 1);
      }
    };

    if (crossedMilestone) {
      setCelebrating(true);
    } else {
      goNext();
    }
  };

  const handleCelebrationDone = () => {
    setCelebrating(false);
    if (roundIndex + 1 >= rounds.length) {
      navigate("/summary");
    } else {
      setRoundIndex((i) => i + 1);
    }
  };

  return (
    <div className={styles.page}>
      <Header title={`${level.icon} ${level.gameName}`} />

      <div className={styles.meta}>
        <ProgressDots total={rounds.length} current={roundIndex} />
        <div className={styles.metaRow}>
          <span className={styles.blendBadge} style={{ background: blend.colour }}>
            Blend {blend.id}
          </span>
          {!config.hideTimer && <span className={styles.timer}>⏱ {formatTime(elapsedMs)}</span>}
        </div>
      </div>

      <div className={styles.gameArea} style={{ borderColor: blend.colour }}>
        <GameComponent
          key={round.id}
          words={round.words}
          blend={blend}
          onResult={handleResult}
          hintsEnabled={config.hintsEnabled}
        />
      </div>

      <div className={styles.recordArea}>
        <RecordButton key={round.id} prompt={round.words[0].word} />
      </div>

      {celebrating && <Celebration onDone={handleCelebrationDone} />}
    </div>
  );
}

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { AttemptRecord, GameId, PhonicsWord, TeacherSettings } from "../types";

/**
 * Single source of truth for "how is this session going". Every game
 * reports results here via recordAttempt; Home/Play/Progress/Parent all
 * read from the same context so nothing has to be threaded through props.
 *
 * Per the PRD there is no backend, so this state is intentionally
 * in-memory only and resets on page refresh (no localStorage/DB).
 */

const DEFAULT_TEACHER_SETTINGS: TeacherSettings = {
  blend: null,
  family: null,
  level: 1,
  guidedMode: false,
  hideTimer: false,
  enableHints: true,
  homeworkBlend: null,
};

interface ProgressContextValue {
  attempts: AttemptRecord[];
  stars: number;
  sessionStartedAt: number;
  teacherSettings: TeacherSettings;
  recordAttempt: (word: PhonicsWord, game: GameId, correct: boolean, tries: number) => void;
  resetSession: () => void;
  updateTeacherSettings: (partial: Partial<TeacherSettings>) => void;
  accuracy: number;
  wordsMastered: string[];
  wordsAttempted: number;
  timePlayedMs: number;
  blendAccuracy: Record<string, { correct: number; total: number }>;
  recommendation: string;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [stars, setStars] = useState(0);
  const [sessionStartedAt, setSessionStartedAt] = useState(() => Date.now());
  const [teacherSettings, setTeacherSettings] = useState<TeacherSettings>(DEFAULT_TEACHER_SETTINGS);

  const recordAttempt = useCallback((word: PhonicsWord, game: GameId, correct: boolean, tries: number) => {
    setAttempts((prev) => [
      ...prev,
      {
        wordId: word.id,
        word: word.word,
        blend: word.blend,
        family: word.family,
        game,
        correct,
        attempts: tries,
        timestamp: Date.now(),
      },
    ]);
    if (correct) {
      setStars((prev) => prev + 1);
    }
  }, []);

  const resetSession = useCallback(() => {
    setAttempts([]);
    setStars(0);
    setSessionStartedAt(Date.now());
  }, []);

  const updateTeacherSettings = useCallback((partial: Partial<TeacherSettings>) => {
    setTeacherSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const derived = useMemo(() => {
    const total = attempts.length;
    const correctCount = attempts.filter((a) => a.correct).length;
    const accuracy = total === 0 ? 0 : Math.round((correctCount / total) * 100);

    // A word counts as "mastered" once its most recent attempt was correct.
    const latestByWord = new Map<string, AttemptRecord>();
    for (const a of attempts) latestByWord.set(a.wordId, a);
    const wordsMastered = [...latestByWord.values()].filter((a) => a.correct).map((a) => a.word);

    const blendAccuracy: Record<string, { correct: number; total: number }> = {};
    for (const a of attempts) {
      blendAccuracy[a.blend] ??= { correct: 0, total: 0 };
      blendAccuracy[a.blend].total += 1;
      if (a.correct) blendAccuracy[a.blend].correct += 1;
    }

    let recommendation = "Keep exploring S blends together!";
    const blendEntries = Object.entries(blendAccuracy);
    if (blendEntries.length > 0) {
      const weakest = blendEntries.reduce((worst, current) => {
        const worstRate = worst[1].correct / worst[1].total;
        const currentRate = current[1].correct / current[1].total;
        return currentRate < worstRate ? current : worst;
      });
      const [weakBlend, stats] = weakest;
      const weakRate = stats.correct / stats.total;
      if (weakRate < 0.7) {
        recommendation = `Practice ${weakBlend} again tomorrow.`;
      } else {
        const allBlends = ["SC", "SK", "SL", "SM", "SN", "SP", "ST", "SW"];
        const nextBlend = allBlends.find((b) => !blendAccuracy[b]);
        recommendation = nextBlend ? `Ready to introduce ${nextBlend} next!` : "Ready for new word families!";
      }
    }

    return {
      accuracy,
      wordsMastered,
      wordsAttempted: total,
      timePlayedMs: total === 0 ? 0 : Date.now() - sessionStartedAt,
      blendAccuracy,
      recommendation,
    };
  }, [attempts, sessionStartedAt]);

  const value: ProgressContextValue = {
    attempts,
    stars,
    sessionStartedAt,
    teacherSettings,
    recordAttempt,
    resetSession,
    updateTeacherSettings,
    ...derived,
  };

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within a ProgressProvider");
  return ctx;
}

/**
 * Shared domain types for the phonics platform. Keeping these in one place
 * means every game, page, and the progress engine agree on the same shapes,
 * so a new blend/family/game can be added without touching this file.
 */

export interface PhonicsWord {
  id: string;
  word: string;
  blend: string;
  family: string;
  emoji: string;
  nonsense: boolean;
  audio: string;
  difficulty: 1 | 2 | 3;
}

export interface Blend {
  id: string;
  letters: string;
  sounds: string[];
  exampleWord: string;
  colour: string;
}

export type GameId =
  | "BuildWord"
  | "DragPicture"
  | "SpinWheel"
  | "ReadingChallenge"
  | "BlendExplorer"
  | "WordFamilyCards";

export type AgeGroup = "nursery" | "lkg" | "ukg";

export interface PhonicsLevel {
  id: number;
  name: string;
  shortName: string;
  description: string;
  game: GameId;
  gameName: string;
  gameTagline: string;
  ageGroup: AgeGroup[];
  icon: string;
  colour: string;
}

export type LearnerLevel = 1 | 2 | 3;

/** A single answered question, kept for the session summary + parent dashboard. */
export interface AttemptRecord {
  wordId: string;
  word: string;
  blend: string;
  family: string;
  game: GameId;
  correct: boolean;
  attempts: number;
  timestamp: number;
}

export interface SessionStats {
  startedAt: number;
  stars: number;
  attempts: AttemptRecord[];
  wordsMastered: Set<string>;
}

/** Settings a teacher can configure for a guided session. */
export interface TeacherSettings {
  blend: string | null;
  family: string | null;
  level: number;
  guidedMode: boolean;
  hideTimer: boolean;
  enableHints: boolean;
  homeworkBlend: string | null;
}

export interface GameProps {
  /** words[0] is the target/answer; the rest are distractors for the round. */
  words: PhonicsWord[];
  blend: Blend;
  onResult: (correct: boolean, word: PhonicsWord, tries: number) => void;
  hintsEnabled: boolean;
}

/** One sound entry in the reference Sounds Guide (e.g. the /ă/ short-a sound). */
export interface PhonicsSound {
  id: string;
  /** Phonemic symbol as shown to the child, e.g. "/ă/". */
  symbol: string;
  /** Common spellings for this sound, e.g. ["a"] or ["ai", "ay", "a_e"]. */
  spellings: string[];
  /** The reference word this sound is introduced with. */
  referenceWord: string;
  /** Five real words to practice this sound. */
  practiceWords: string[];
}

export interface PhonicsSoundCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  colour: string;
  sounds: PhonicsSound[];
}

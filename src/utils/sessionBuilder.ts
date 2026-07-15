import type { GameId, PhonicsWord } from "../types";
import { allBlends, allWords, getWordsByBlend, pickDistractors, pickRandom, shuffle } from "./phonicsData";

export interface Round {
  id: string;
  game: GameId;
  words: PhonicsWord[];
}

export interface SessionConfig {
  blend: string | null;
  family: string | null;
  /** If set, only this level's game is used (guided/teacher mode). Otherwise cycles through all 5. */
  onlyGame: GameId | null;
  roundCount: number;
}

const ALL_GAMES: GameId[] = ["BlendExplorer", "SpinWheel", "BuildWord", "DragPicture", "ReadingChallenge", "WordFamilyCards"];
const DISTRACTOR_COUNT = 2;

function poolFor(blend: string | null, family: string | null): PhonicsWord[] {
  let pool = blend ? getWordsByBlend(blend) : allWords;
  if (family) pool = pool.filter((w) => w.family === family);
  return pool.length > 0 ? pool : allWords;
}

function pickTarget(pool: PhonicsWord[], requireEmoji: boolean, usedIds: Set<string>): PhonicsWord {
  const candidates = requireEmoji ? pool.filter((w) => !w.nonsense) : pool;
  const usable = candidates.length > 0 ? candidates : pool;
  const fresh = usable.filter((w) => !usedIds.has(w.id));
  const source = fresh.length > 0 ? fresh : usable;
  return pickRandom(source, 1)[0];
}

function buildRound(game: GameId, blend: string | null, family: string | null, usedIds: Set<string>): Round {
  const pool = poolFor(blend, family);

  if (game === "SpinWheel") {
    const focusPool = pool.filter((w) => !w.nonsense);
    const target = focusPool.length > 0 ? pickRandom(focusPool, 1)[0] : pickRandom(allWords.filter((w) => !w.nonsense), 1)[0];
    const otherBlends = allBlends.filter((b) => b.id !== target.blend);
    const otherWords = shuffle(otherBlends)
      .slice(0, 5)
      .map((b) => {
        const realWords = getWordsByBlend(b.id, { includeNonsense: false });
        return pickRandom(realWords.length > 0 ? realWords : getWordsByBlend(b.id), 1)[0];
      })
      .filter(Boolean);
    return { id: `${game}-${target.id}-${Math.random()}`, game, words: [target, ...otherWords] };
  }

  if (game === "WordFamilyCards") {
    const focusPool = pool.filter((w) => !w.nonsense);
    const target = focusPool.length > 0 ? pickRandom(focusPool, 1)[0] : pickRandom(allWords.filter((w) => !w.nonsense), 1)[0];
    const otherBlends = allBlends.filter((b) => b.id !== target.blend);
    const decoyBlendWords = shuffle(otherBlends)
      .slice(0, 4)
      .map((b) => {
        const realWords = getWordsByBlend(b.id, { includeNonsense: false });
        return pickRandom(realWords.length > 0 ? realWords : getWordsByBlend(b.id), 1)[0];
      })
      .filter(Boolean);
    return { id: `${game}-${target.id}-${Math.random()}`, game, words: [target, ...decoyBlendWords] };
  }

  const requireEmoji = game === "DragPicture" || game === "ReadingChallenge" || game === "BlendExplorer";
  const target = pickTarget(pool, requireEmoji, usedIds);
  const distractorPool = requireEmoji ? allWords.filter((w) => !w.nonsense) : pool;
  const distractors = pickDistractors(target, distractorPool, DISTRACTOR_COUNT);
  return { id: `${game}-${target.id}-${Math.random()}`, game, words: [target, ...distractors] };
}

/** Builds the ordered list of rounds for a session (independent auto-play or teacher-guided). */
export function buildSession(config: SessionConfig): Round[] {
  const { blend, family, onlyGame, roundCount } = config;
  const usedIds = new Set<string>();
  const rounds: Round[] = [];

  const gameSequence = onlyGame ? Array(roundCount).fill(onlyGame) : Array.from({ length: roundCount }, (_, i) => ALL_GAMES[i % ALL_GAMES.length]);

  for (const game of gameSequence) {
    const round = buildRound(game, blend, family, usedIds);
    usedIds.add(round.words[0].id);
    rounds.push(round);
  }

  return rounds;
}

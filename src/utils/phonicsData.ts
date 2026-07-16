import wordsData from "../data/words.json";
import blendsData from "../data/blends.json";
import levelsData from "../data/levels.json";
import phonicsGuideData from "../data/phonicsGuide.json";
import type { Blend, GameId, PhonicsLevel, PhonicsSoundCategory, PhonicsWord } from "../types";

/**
 * All phonics content access goes through this module. If the JSON files
 * are ever swapped for a CMS/backend call, only this file needs to change.
 */

export const allWords = wordsData as PhonicsWord[];
export const allBlends = blendsData as Blend[];
export const allLevels = levelsData as PhonicsLevel[];
export const phonicsGuide = phonicsGuideData as PhonicsSoundCategory[];

export function getBlend(blendId: string): Blend {
  const blend = allBlends.find((b) => b.id === blendId);
  if (!blend) throw new Error(`Unknown blend: ${blendId}`);
  return blend;
}

export function getWordsByBlend(blendId: string, opts: { includeNonsense?: boolean } = {}): PhonicsWord[] {
  const { includeNonsense = true } = opts;
  return allWords.filter((w) => w.blend === blendId && (includeNonsense || !w.nonsense));
}

export function getWordsByFamily(family: string): PhonicsWord[] {
  return allWords.filter((w) => w.family === family);
}

export function getLevelByGame(game: GameId): PhonicsLevel {
  const level = allLevels.find((l) => l.game === game);
  if (!level) throw new Error(`No level configured for game: ${game}`);
  return level;
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function pickRandom<T>(items: T[], count: number): T[] {
  return shuffle(items).slice(0, Math.min(count, items.length));
}

/** Picks a set of "distractor" words that don't share the target's family, for match/drag games. */
export function pickDistractors(target: PhonicsWord, pool: PhonicsWord[], count: number): PhonicsWord[] {
  const candidates = pool.filter((w) => w.id !== target.id && !w.nonsense && w.family !== target.family);
  return pickRandom(candidates, count);
}

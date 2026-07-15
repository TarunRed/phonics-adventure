import { useEffect, useRef } from "react";
import type { PhonicsWord } from "../types";
import { speak, speakSequence } from "../utils/speech";

/**
 * Implements the PRD's staged error-handling ladder:
 *   1 wrong  -> gentle encouragement
 *   2 wrong  -> highlight the blend + word family
 *   4 wrong  -> speak the blend + word family
 *   6 wrong  -> speak the whole word, animate blending, allow retry
 *
 * `incorrectCount` is the number of wrong answers on the CURRENT question.
 * Consumers re-render with the returned stage info each time it changes.
 */

const ENCOURAGEMENTS = ["Nice try! Let's try again.", "Almost there — you can do it!", "Good thinking, try once more!"];

export interface ErrorEscalationStage {
  message: string | null;
  highlight: boolean;
  showAnimation: boolean;
}

export function useErrorEscalation(incorrectCount: number, word: PhonicsWord): ErrorEscalationStage {
  const lastSpokenAt = useRef(-1);

  useEffect(() => {
    if (incorrectCount === lastSpokenAt.current) return;
    lastSpokenAt.current = incorrectCount;

    if (incorrectCount === 4) {
      speakSequence([word.blend.toLowerCase(), word.family]);
    } else if (incorrectCount >= 6) {
      speak(word.word);
    }
  }, [incorrectCount, word]);

  if (incorrectCount <= 0) {
    return { message: null, highlight: false, showAnimation: false };
  }
  if (incorrectCount === 1) {
    return { message: ENCOURAGEMENTS[0], highlight: false, showAnimation: false };
  }
  if (incorrectCount < 4) {
    return { message: `Look at the blend "${word.blend}" and the ending "${word.family}".`, highlight: true, showAnimation: false };
  }
  if (incorrectCount < 6) {
    return { message: `Listen: "${word.blend.toLowerCase()}" + "${word.family}"`, highlight: true, showAnimation: false };
  }
  return { message: `The word is "${word.word}". Watch it blend, then try again.`, highlight: true, showAnimation: true };
}

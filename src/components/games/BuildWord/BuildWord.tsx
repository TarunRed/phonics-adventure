import { useEffect, useMemo, useState } from "react";
import type { GameProps } from "../../../types";
import { shuffle } from "../../../utils/phonicsData";
import { speak } from "../../../utils/speech";
import { useErrorEscalation } from "../../../hooks/useErrorEscalation";
import { LetterChip } from "../../shared/LetterChip";
import { AudioButton } from "../../shared/AudioButton";
import { HintBubble } from "../../shared/HintBubble";
import styles from "./BuildWord.module.css";

const VOWELS = new Set(["a", "e", "i", "o", "u"]);

interface Slot {
  letter: string;
  prefilled: boolean;
  filledBy: number | null; // index into tiles array, or null if empty
}

interface Tile {
  id: number;
  letter: string;
  used: boolean;
}

function buildSlots(word: string, family: string, scaffold: boolean): Slot[] {
  const familyStart = word.length - family.length;
  let prefillIndex = -1;
  if (scaffold) {
    for (let i = familyStart; i < word.length; i++) {
      if (VOWELS.has(word[i])) {
        prefillIndex = i;
        break;
      }
    }
  }
  return word.split("").map((letter, i) => ({
    letter,
    prefilled: i === prefillIndex,
    filledBy: null,
  }));
}

/** Game 1: Build the Word — tap letters into empty slots to spell the target word. */
export function BuildWord({ words, onResult, hintsEnabled }: GameProps) {
  const target = words[0];
  const scaffold = target.difficulty === 1;

  const [slots, setSlots] = useState<Slot[]>(() => buildSlots(target.word, target.family, scaffold));
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [status, setStatus] = useState<"playing" | "correct">("playing");
  const escalation = useErrorEscalation(incorrectCount, target);

  useEffect(() => {
    const initialSlots = buildSlots(target.word, target.family, scaffold);
    setSlots(initialSlots);
    const letterTiles = initialSlots
      .map((slot, i) => ({ id: i, letter: slot.letter, used: false }))
      .filter((_, i) => !initialSlots[i].prefilled);
    setTiles(shuffle(letterTiles));
    setIncorrectCount(0);
    setStatus("playing");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.id]);

  const nextEmptyIndex = useMemo(() => slots.findIndex((s) => !s.prefilled && s.filledBy === null), [slots]);

  const placeTile = (tile: Tile) => {
    if (tile.used || status !== "playing" || nextEmptyIndex === -1) return;
    const newSlots = [...slots];
    newSlots[nextEmptyIndex] = { ...newSlots[nextEmptyIndex], filledBy: tile.id };
    setSlots(newSlots);
    setTiles((prev) => prev.map((t) => (t.id === tile.id ? { ...t, used: true } : t)));

    const isComplete = newSlots.every((s) => s.prefilled || s.filledBy !== null);
    if (isComplete) {
      checkAnswer(newSlots);
    }
  };

  const removeFromSlot = (slotIndex: number) => {
    const slot = slots[slotIndex];
    if (slot.prefilled || slot.filledBy === null || status !== "playing") return;
    setTiles((prev) => prev.map((t) => (t.id === slot.filledBy ? { ...t, used: false } : t)));
    setSlots((prev) => prev.map((s, i) => (i === slotIndex ? { ...s, filledBy: null } : s)));
  };

  const checkAnswer = (finalSlots: Slot[]) => {
    const assembled = finalSlots.map((s) => s.letter).join("");
    if (assembled === target.word) {
      setStatus("correct");
      speak(target.word);
      setTimeout(() => onResult(true, target, incorrectCount + 1), 1400);
    } else {
      const tries = incorrectCount + 1;
      setIncorrectCount(tries);
      if (tries >= 8) {
        setStatus("correct"); // reveal & move on so no one gets stuck
        speak(target.word);
        setTimeout(() => onResult(false, target, tries), 1800);
        return;
      }
      setTimeout(() => {
        setSlots((prev) => prev.map((s) => (s.prefilled ? s : { ...s, filledBy: null })));
        setTiles((prev) => prev.map((t) => ({ ...t, used: false })));
      }, 700);
    }
  };

  return (
    <div className={styles.game}>
      {!target.nonsense && <div className={styles.emoji}>{target.emoji}</div>}
      <div className={styles.wordRow}>
        <AudioButton text={target.word} size="sm" label="Hear the word" />
        <div className={styles.slots}>
          {slots.map((slot, i) => (
            <LetterChip
              key={i}
              letter={slot.letter}
              filled={slot.prefilled || slot.filledBy !== null}
              empty={!slot.prefilled && slot.filledBy === null}
              onClick={!slot.prefilled && slot.filledBy !== null ? () => removeFromSlot(i) : undefined}
              state={status === "correct" ? "correct" : escalation.highlight && slot.prefilled ? "idle" : "idle"}
            />
          ))}
        </div>
      </div>

      <div className={styles.tray}>
        {tiles.map((tile) => (
          <LetterChip key={tile.id} letter={tile.letter} onClick={tile.used ? undefined : () => placeTile(tile)} filled={tile.used} />
        ))}
      </div>

      {hintsEnabled && escalation.message && <HintBubble message={escalation.message} tone={incorrectCount >= 2 ? "hint" : "encourage"} />}

      {escalation.showAnimation && (
        <div className={styles.blendDemo}>
          <span>{target.blend}</span>
          <span className={styles.arrow}>→</span>
          <span>{target.word}</span>
        </div>
      )}
    </div>
  );
}

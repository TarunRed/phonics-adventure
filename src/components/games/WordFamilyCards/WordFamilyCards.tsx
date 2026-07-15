import { useEffect, useMemo, useState } from "react";
import type { GameProps } from "../../../types";
import { shuffle } from "../../../utils/phonicsData";
import { speak } from "../../../utils/speech";
import { useErrorEscalation } from "../../../hooks/useErrorEscalation";
import { useProgress } from "../../../context/ProgressContext";
import { AudioButton } from "../../shared/AudioButton";
import { HintBubble } from "../../shared/HintBubble";
import styles from "./WordFamilyCards.module.css";

/**
 * Game 6: Word Family Flash Cards — a picture and its word family ending
 * are always shown; the child taps the blend that completes the word.
 * Modelled on toytheater.com's word-family flash cards, with a running
 * session Correct/Incorrect tally like the reference.
 */
export function WordFamilyCards({ words, blend, onResult, hintsEnabled }: GameProps) {
  const target = words[0];
  const options = useMemo(() => shuffle(words), [target.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const { attempts } = useProgress();

  const [incorrectCount, setIncorrectCount] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState<"guessing" | "correct">("guessing");
  const escalation = useErrorEscalation(incorrectCount, target);

  useEffect(() => {
    setIncorrectCount(0);
    setSelected(null);
    setStatus("guessing");
  }, [target.id]);

  const sessionCorrect = attempts.filter((a) => a.correct).length;
  const sessionIncorrect = attempts.filter((a) => !a.correct).length;

  const handlePick = (wordId: string) => {
    if (status !== "guessing") return;
    setSelected(wordId);
    if (wordId === target.id) {
      setStatus("correct");
      speak(target.word);
      setTimeout(() => onResult(true, target, incorrectCount + 1), 1400);
    } else {
      const tries = incorrectCount + 1;
      setIncorrectCount(tries);
      setTimeout(() => setSelected(null), 500);
      if (tries >= 8) {
        setStatus("correct");
        speak(target.word);
        setTimeout(() => onResult(false, target, tries), 1800);
      }
    }
  };

  return (
    <div className={styles.game}>
      <div className={styles.scoreRow}>
        <span className={styles.scoreCorrect}>Correct: {sessionCorrect}</span>
        <span className={styles.scoreIncorrect}>Incorrect: {sessionIncorrect}</span>
      </div>

      <p className={styles.prompt}>Select the blend that completes the word.</p>

      <div className={styles.card} style={{ borderColor: blend.colour }}>
        <div className={styles.emoji}>{target.emoji}</div>
        <div className={styles.textRow}>
          {status === "guessing" ? (
            <>
              <span className={styles.familyText}>{target.family}</span>
              <AudioButton text={target.family} size="sm" label="Hear the ending" />
            </>
          ) : (
            <>
              <span className={styles.wordText}>{target.word}</span>
              <AudioButton text={target.word} size="sm" label="Hear the word" />
            </>
          )}
        </div>
        {status === "correct" && <p className={styles.great}>Great!</p>}
      </div>

      <div className={styles.options}>
        {options.map((word) => {
          const state = selected === word.id ? (word.id === target.id ? styles.correctBtn : styles.incorrectBtn) : "";
          return (
            <button
              key={word.id}
              type="button"
              className={[styles.blendButton, state].join(" ")}
              onClick={() => handlePick(word.id)}
              disabled={status !== "guessing"}
            >
              {word.blend.toLowerCase()}
            </button>
          );
        })}
      </div>

      {hintsEnabled && escalation.message && <HintBubble message={escalation.message} tone={incorrectCount >= 2 ? "hint" : "encourage"} />}
    </div>
  );
}

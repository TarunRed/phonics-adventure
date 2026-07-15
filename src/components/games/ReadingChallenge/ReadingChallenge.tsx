import { useEffect, useMemo, useState } from "react";
import type { GameProps } from "../../../types";
import { shuffle } from "../../../utils/phonicsData";
import { speak } from "../../../utils/speech";
import { useErrorEscalation } from "../../../hooks/useErrorEscalation";
import { EmojiTile } from "../../shared/EmojiTile";
import { AudioButton } from "../../shared/AudioButton";
import { HintBubble } from "../../shared/HintBubble";
import styles from "./ReadingChallenge.module.css";

/**
 * Game 4: Reading Challenge — see the word, tap Play to hear it, tap the matching picture.
 * Independent readers (difficulty 3 / hints off) get a "read silently" variant: the word
 * is never spoken automatically, only on request, pushing toward independent decoding.
 */
export function ReadingChallenge({ words, onResult, hintsEnabled }: GameProps) {
  const target = words[0];
  const options = useMemo(() => shuffle(words), [target.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const silentMode = !hintsEnabled;

  const [incorrectCount, setIncorrectCount] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState<"playing" | "done">("playing");
  const escalation = useErrorEscalation(incorrectCount, target);

  useEffect(() => {
    setIncorrectCount(0);
    setSelected(null);
    setStatus("playing");
    if (!silentMode) speak(target.word);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.id]);

  const handlePick = (wordId: string) => {
    if (status !== "playing") return;
    setSelected(wordId);
    if (wordId === target.id) {
      setStatus("done");
      setTimeout(() => onResult(true, target, incorrectCount + 1), 1000);
    } else {
      const tries = incorrectCount + 1;
      setIncorrectCount(tries);
      setTimeout(() => setSelected(null), 500);
      if (tries >= 8) {
        setStatus("done");
        speak(target.word);
        setTimeout(() => onResult(false, target, tries), 1600);
      }
    }
  };

  return (
    <div className={styles.game}>
      <div className={styles.prompt}>
        <h2 className={styles.word}>{target.word}</h2>
        <AudioButton text={target.word} size="lg" label="Play word" />
      </div>
      {silentMode && <p className={styles.hintText}>Read it silently, then tap the picture it matches.</p>}

      <div className={styles.options}>
        {options.map((word) => (
          <EmojiTile
            key={word.id}
            emoji={word.emoji}
            selected={selected === word.id}
            state={selected === word.id ? (word.id === target.id ? "correct" : "incorrect") : "idle"}
            onClick={() => handlePick(word.id)}
          />
        ))}
      </div>

      {hintsEnabled && escalation.message && <HintBubble message={escalation.message} tone={incorrectCount >= 2 ? "hint" : "encourage"} />}
    </div>
  );
}

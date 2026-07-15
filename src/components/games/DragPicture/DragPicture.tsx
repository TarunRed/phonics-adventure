import { useEffect, useMemo, useState } from "react";
import type { GameProps } from "../../../types";
import { shuffle } from "../../../utils/phonicsData";
import { speak } from "../../../utils/speech";
import { useErrorEscalation } from "../../../hooks/useErrorEscalation";
import { EmojiTile } from "../../shared/EmojiTile";
import { AudioButton } from "../../shared/AudioButton";
import { HintBubble } from "../../shared/HintBubble";
import styles from "./DragPicture.module.css";

/** Game 2: Drag Picture to Word — tap the picture that matches the shown/spoken word. */
export function DragPicture({ words, onResult, hintsEnabled }: GameProps) {
  const target = words[0];
  const options = useMemo(() => shuffle(words), [target.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const [incorrectCount, setIncorrectCount] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState<"playing" | "done">("playing");
  const escalation = useErrorEscalation(incorrectCount, target);

  useEffect(() => {
    setIncorrectCount(0);
    setSelected(null);
    setStatus("playing");
    speak(target.word);
  }, [target.id, target.word]);

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
        <h2>{target.word}</h2>
        <AudioButton text={target.word} size="md" label="Hear the word" />
      </div>

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

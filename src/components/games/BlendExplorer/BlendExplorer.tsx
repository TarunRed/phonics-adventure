import { useEffect, useState } from "react";
import type { GameProps } from "../../../types";
import { shuffle } from "../../../utils/phonicsData";
import { speak, speakSequence, stretchSound } from "../../../utils/speech";
import { EmojiTile } from "../../shared/EmojiTile";
import { Button } from "../../shared/Button";
import styles from "./BlendExplorer.module.css";

type Stage = "letters" | "blend" | "word" | "check";

/** Game 5: Blend Explorer — watch two letters merge into a blend, then into a whole word. */
export function BlendExplorer({ words, onResult }: GameProps) {
  const target = words[0];
  const [letter1, letter2] = target.blend.toLowerCase().split("");
  const [stage, setStage] = useState<Stage>("letters");
  const [selected, setSelected] = useState<string | null>(null);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const options = shuffle(words);

  useEffect(() => {
    setStage("letters");
    setSelected(null);
    setIncorrectCount(0);
    speakSequence([stretchSound(letter1), stretchSound(letter2)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.id]);

  const advance = () => {
    if (stage === "letters") {
      setStage("blend");
      speak(target.blend.toLowerCase());
    } else if (stage === "blend") {
      setStage("word");
      speak(target.word);
    } else if (stage === "word") {
      setStage("check");
    }
  };

  const handlePick = (wordId: string) => {
    setSelected(wordId);
    if (wordId === target.id) {
      setTimeout(() => onResult(true, target, incorrectCount + 1), 900);
    } else {
      const tries = incorrectCount + 1;
      setIncorrectCount(tries);
      setTimeout(() => setSelected(null), 500);
      if (tries >= 8) {
        setTimeout(() => onResult(false, target, tries), 1400);
      }
    }
  };

  return (
    <div className={styles.game}>
      <div className={styles.stage}>
        {stage === "letters" && (
          <div className={styles.row}>
            <span className={styles.tile}>{letter1.toUpperCase()}</span>
            <span className={styles.tile}>{letter2.toUpperCase()}</span>
          </div>
        )}
        {stage === "blend" && (
          <div className={styles.row}>
            <span className={[styles.tile, styles.merged].join(" ")}>{target.blend}</span>
          </div>
        )}
        {(stage === "word" || stage === "check") && (
          <div className={styles.row}>
            <span className={[styles.tile, styles.wordTile].join(" ")}>{target.word}</span>
            {!target.nonsense && stage === "word" && <span className={styles.emoji}>{target.emoji}</span>}
          </div>
        )}
      </div>

      {stage !== "check" && (
        <Button variant="secondary" onClick={advance}>
          {stage === "letters" ? "Blend them!" : stage === "blend" ? "Add the ending" : "Which picture?"}
        </Button>
      )}

      {stage === "check" && (
        <div className={styles.checkArea}>
          <h3>Which one is "{target.word}"?</h3>
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
        </div>
      )}
    </div>
  );
}

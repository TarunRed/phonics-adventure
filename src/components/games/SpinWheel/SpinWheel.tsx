import { useMemo, useState } from "react";
import type { GameProps, PhonicsWord } from "../../../types";
import { pickRandom, shuffle } from "../../../utils/phonicsData";
import { speak } from "../../../utils/speech";
import { useErrorEscalation } from "../../../hooks/useErrorEscalation";
import { EmojiTile } from "../../shared/EmojiTile";
import { AudioButton } from "../../shared/AudioButton";
import { Button } from "../../shared/Button";
import { HintBubble } from "../../shared/HintBubble";
import styles from "./SpinWheel.module.css";

const SEGMENT_COLOURS = ["#FF9F6B", "#FFC15E", "#8FD6A4", "#7EC8E3", "#9AA9FF", "#C9A0FF"];

/** Game 3: Spin the Wheel — spin lands on a blend, then find the matching word. */
export function SpinWheel({ words, onResult, hintsEnabled }: GameProps) {
  const segments = useMemo(() => {
    const uniqueByBlend = new Map<string, PhonicsWord>();
    for (const w of words) if (!uniqueByBlend.has(w.blend)) uniqueByBlend.set(w.blend, w);
    const list = [...uniqueByBlend.values()];
    return list.length >= 3 ? list.slice(0, 6) : words.slice(0, Math.min(6, words.length));
  }, [words]);

  const target = words[0];
  const [rotation, setRotation] = useState(0);
  const [landedIndex, setLandedIndex] = useState<number | null>(null);
  const [options, setOptions] = useState<PhonicsWord[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [status, setStatus] = useState<"idle" | "spinning" | "playing" | "done">("idle");

  const landedWord = landedIndex !== null ? segments[landedIndex] : null;
  const escalation = useErrorEscalation(incorrectCount, landedWord ?? target);

  const handleSpin = () => {
    if (status !== "idle") return;
    const targetIndex = Math.max(0, segments.findIndex((s) => s.blend === target.blend));
    const segmentAngle = 360 / segments.length;
    const finalAngle = 360 * 5 + (360 - (targetIndex * segmentAngle + segmentAngle / 2));
    setRotation(finalAngle);
    setStatus("spinning");
  };

  const handleTransitionEnd = () => {
    if (status !== "spinning") return;
    const targetIndex = Math.max(0, segments.findIndex((s) => s.blend === target.blend));
    setLandedIndex(targetIndex);
    setStatus("playing");
    const landed = segments[targetIndex];
    speak(`${landed.blend}. Find a word that starts with ${landed.blend}.`);
    const distractors = pickRandom(
      words.filter((w) => w.blend !== landed.blend),
      2
    );
    setOptions(shuffle([landed, ...distractors]));
  };

  const handlePick = (wordId: string) => {
    if (status !== "playing" || !landedWord) return;
    setSelected(wordId);
    if (wordId === landedWord.id) {
      setStatus("done");
      setTimeout(() => onResult(true, landedWord, incorrectCount + 1), 1000);
    } else {
      const tries = incorrectCount + 1;
      setIncorrectCount(tries);
      setTimeout(() => setSelected(null), 500);
      if (tries >= 8) {
        setStatus("done");
        setTimeout(() => onResult(false, landedWord, tries), 1600);
      }
    }
  };

  return (
    <div className={styles.game}>
      <div className={styles.wheelWrap}>
        <div className={styles.pointer}>▼</div>
        <div
          className={styles.wheel}
          style={{
            transform: `rotate(${rotation}deg)`,
            background: `conic-gradient(${segments
              .map((_, i) => `${SEGMENT_COLOURS[i % SEGMENT_COLOURS.length]} ${(i * 360) / segments.length}deg ${((i + 1) * 360) / segments.length}deg`)
              .join(", ")})`,
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {segments.map((s, i) => (
            <span
              key={s.id}
              className={styles.segmentLabel}
              style={{ transform: `rotate(${(i + 0.5) * (360 / segments.length)}deg)` }}
            >
              {s.blend}
            </span>
          ))}
        </div>
      </div>

      {status === "idle" && (
        <Button variant="secondary" onClick={handleSpin}>
          Spin the Wheel!
        </Button>
      )}
      {status === "spinning" && <p className={styles.spinningText}>Spinning...</p>}

      {status !== "idle" && status !== "spinning" && landedWord && (
        <div className={styles.challenge}>
          <div className={styles.challengeHeading}>
            <h3>Find a word that starts with "{landedWord.blend}"</h3>
            <AudioButton
              text={`${landedWord.blend}. Find a word that starts with ${landedWord.blend}.`}
              size="sm"
              label="Hear the challenge again"
            />
          </div>
          <div className={styles.options}>
            {options.map((word) => (
              <EmojiTile
                key={word.id}
                emoji={word.emoji}
                selected={selected === word.id}
                state={selected === word.id ? (word.id === landedWord.id ? "correct" : "incorrect") : "idle"}
                onClick={() => handlePick(word.id)}
              />
            ))}
          </div>
        </div>
      )}

      {hintsEnabled && escalation.message && <HintBubble message={escalation.message} tone={incorrectCount >= 2 ? "hint" : "encourage"} />}
    </div>
  );
}

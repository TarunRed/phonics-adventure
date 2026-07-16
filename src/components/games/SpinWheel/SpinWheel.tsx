import { useMemo, useState } from "react";
import type { GameProps, PhonicsWord } from "../../../types";
import { pickRandom, shuffle } from "../../../utils/phonicsData";
import { speak } from "../../../utils/speech";
import { useErrorEscalation } from "../../../hooks/useErrorEscalation";
import { EmojiTile } from "../../shared/EmojiTile";
import { AudioButton } from "../../shared/AudioButton";
import { Button } from "../../shared/Button";
import { HintBubble } from "../../shared/HintBubble";
import { PronunciationCheck } from "../../shared/PronunciationCheck";
import styles from "./SpinWheel.module.css";

const SEGMENT_COLOURS = ["#FF9F6B", "#FFC15E", "#8FD6A4", "#7EC8E3", "#9AA9FF", "#C9A0FF"];

/**
 * Speaks a blend as one continuous, blended sound (e.g. "sl" said the way
 * it starts "slide") rather than as two separate stretched letter sounds
 * with a gap between them — that gap is exactly what a blend isn't.
 */
function speakBlendSounds(blend: string): void {
  speak(blend.toLowerCase());
}

type Status = "idle" | "spinning" | "verifyBlend" | "playing" | "verifyWord" | "done";

/**
 * Game 3: Spin the Wheel — spin lands on a blend, say the blend sound to
 * check your pronunciation, find the matching picture, then say the whole
 * word to finish.
 */
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
  const [status, setStatus] = useState<Status>("idle");
  const [pendingResult, setPendingResult] = useState<{ correct: boolean; tries: number } | null>(null);

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
    const landed = segments[targetIndex];
    speakBlendSounds(landed.blend);
    const distractors = pickRandom(
      words.filter((w) => w.blend !== landed.blend),
      2
    );
    setOptions(shuffle([landed, ...distractors]));
    setStatus("verifyBlend");
  };

  const startPicking = () => {
    if (!landedWord) return;
    speak(`Find a word that starts with ${landedWord.blend.toLowerCase()}.`);
    setStatus("playing");
  };

  const handlePick = (wordId: string) => {
    if (status !== "playing" || !landedWord) return;
    setSelected(wordId);
    if (wordId === landedWord.id) {
      const tries = incorrectCount + 1;
      setTimeout(() => {
        setPendingResult({ correct: true, tries });
        setStatus("verifyWord");
      }, 1000);
    } else {
      const tries = incorrectCount + 1;
      setIncorrectCount(tries);
      setTimeout(() => setSelected(null), 500);
      if (tries >= 8) {
        speak(landedWord.word);
        setTimeout(() => {
          setPendingResult({ correct: false, tries });
          setStatus("verifyWord");
        }, 1600);
      }
    }
  };

  const finishRound = () => {
    if (!pendingResult || !landedWord) return;
    onResult(pendingResult.correct, landedWord, pendingResult.tries);
    setStatus("done");
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

      {status === "verifyBlend" && landedWord && (
        <PronunciationCheck
          target={landedWord.blend.toLowerCase()}
          instruction="Say the sound it landed on:"
          continueLabel="Find the picture"
          onContinue={startPicking}
          onReadAloud={() => speakBlendSounds(landedWord.blend)}
        />
      )}

      {status === "playing" && landedWord && (
        <div className={styles.challenge}>
          <div className={styles.challengeHeading}>
            <h3>Find a word that starts with "{landedWord.blend}"</h3>
            <AudioButton
              text={`${landedWord.blend.toLowerCase()}. Find a word that starts with ${landedWord.blend.toLowerCase()}.`}
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

      {status === "verifyWord" && landedWord && (
        <PronunciationCheck
          target={landedWord.word}
          instruction="Now read and say the whole word:"
          continueLabel="Finish"
          onContinue={finishRound}
        />
      )}

      {hintsEnabled && status === "playing" && escalation.message && (
        <HintBubble message={escalation.message} tone={incorrectCount >= 2 ? "hint" : "encourage"} />
      )}
    </div>
  );
}

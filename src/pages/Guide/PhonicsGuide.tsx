import { useState } from "react";
import posthog from "posthog-js";
import { phonicsGuide } from "../../utils/phonicsData";
import { speak, stretchSound } from "../../utils/speech";
import type { PhonicsSound, PhonicsSoundCategory } from "../../types";
import { Header } from "../../components/shared/Header";
import styles from "./PhonicsGuide.module.css";

/**
 * How to play "the sound itself" (as opposed to a whole example word) for
 * each category. The sound button must say the sound, not jump straight to
 * a word — the reference word is for the "examples" section below it.
 *
 *  - "stretch": a single consonant phoneme. Pulled from the symbol (e.g.
 *    "/z/" -> "z"), not the spelling — some rows spell a /z/ sound with
 *    "s" (as in "his"), and stretching the letter "s" would say the wrong
 *    sound. Reuses stretchSound(), the same pure-sound/no-schwa logic
 *    every game already uses.
 *  - "unit": a multi-letter chunk (digraph or blend) spoken as one
 *    continuous sound, same approach as Spin the Wheel's blend step.
 *  - "word": sounds that can't be isolated as plain text at all (vowel
 *    sounds, schwa) — TTS has no way to say a bare "ă" without a word
 *    around it, so these fall back to the reference word.
 */
const CATEGORY_SOUND_MODE: Record<string, "stretch" | "unit" | "word"> = {
  schwa: "word",
  "short-vowels": "word",
  "long-vowels": "word",
  "vowel-r": "word",
  "other-vowel-teams": "word",
  consonants: "stretch",
  "soft-consonants": "stretch",
  "silent-consonants": "stretch",
  digraphs: "unit",
  "s-blends": "unit",
};

// A couple of digraph rows are really just a single consonant phoneme
// spelled a different way (e.g. "ck" for /k/, same sound as the "k" row
// in Consonants) — those need the symbol-derived stretch treatment too,
// not "speak the spelling as one unit".
const SOUND_MODE_OVERRIDE: Record<string, "stretch" | "unit" | "word"> = {
  "d-ck": "stretch",
};

function playSound(category: PhonicsSoundCategory, sound: PhonicsSound): void {
  const mode = SOUND_MODE_OVERRIDE[sound.id] ?? CATEGORY_SOUND_MODE[category.id] ?? "word";

  if (mode === "stretch") {
    const letter = sound.symbol.replace(/\//g, "");
    speak(stretchSound(letter));
  } else if (mode === "unit") {
    speak(sound.spellings[0].toLowerCase());
  } else {
    speak(sound.referenceWord.split(",")[0].trim());
  }
}

function SoundCard({ category, sound }: { category: PhonicsSoundCategory; sound: PhonicsSound }) {
  return (
    <div className={styles.card} style={{ borderColor: category.colour }}>
      <div className={styles.cardHead}>
        <button
          type="button"
          className={styles.symbolButton}
          style={{ background: category.colour }}
          onClick={() => playSound(category, sound)}
          aria-label={`Hear the ${sound.symbol} sound`}
        >
          {sound.symbol}
        </button>
        <div className={styles.spellings}>
          {sound.spellings.map((s) => (
            <span key={s} className={styles.spellingChip}>
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.practiceWords}>
        {sound.practiceWords.map((word) => (
          <button type="button" key={word} className={styles.wordChip} onClick={() => speak(word)} aria-label={`Hear "${word}"`}>
            {word} <span className={styles.wordSpeaker}>🔈</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function CategorySection({ category, expanded, onToggle }: { category: PhonicsSoundCategory; expanded: boolean; onToggle: () => void }) {
  return (
    <section className={styles.category}>
      <button type="button" className={styles.categoryHeader} onClick={onToggle} style={{ borderColor: category.colour }}>
        <span className={styles.categoryIcon}>{category.icon}</span>
        <span className={styles.categoryTitle}>
          <span className={styles.categoryName}>{category.name}</span>
          <span className={styles.categoryDesc}>{category.description}</span>
        </span>
        <span className={styles.categoryMeta}>
          <span className={styles.categoryCount}>{category.sounds.length}</span>
          <span className={[styles.chevron, expanded ? styles.chevronOpen : ""].join(" ")}>▾</span>
        </span>
      </button>

      {expanded && (
        <div className={styles.cardGrid}>
          {category.sounds.map((sound) => (
            <SoundCard key={sound.id} category={category} sound={sound} />
          ))}
        </div>
      )}
    </section>
  );
}

export function PhonicsGuide() {
  const [expandedId, setExpandedId] = useState<string | null>(phonicsGuide[0]?.id ?? null);

  const handleToggle = (category: PhonicsSoundCategory) => {
    const isExpanding = expandedId !== category.id;
    setExpandedId((prev) => (prev === category.id ? null : category.id));
    if (isExpanding) {
      posthog.capture("guide_category_expanded", {
        category_id: category.id,
        category_name: category.name,
        sound_count: category.sounds.length,
      });
    }
  };

  return (
    <div className={styles.page}>
      <Header title="📖 Sounds Guide" showStars={false} />

      <p className={styles.intro}>
        Every sound this app is built on, from a full structured-phonics reference. Tap a symbol to hear the
        sound, or tap a word to hear it read aloud.
      </p>

      <div className={styles.categories}>
        {phonicsGuide.map((category) => (
          <CategorySection
            key={category.id}
            category={category}
            expanded={expandedId === category.id}
            onToggle={() => handleToggle(category)}
          />
        ))}
      </div>
    </div>
  );
}

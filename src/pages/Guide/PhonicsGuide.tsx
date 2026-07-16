import { useState } from "react";
import { phonicsGuide } from "../../utils/phonicsData";
import { speak } from "../../utils/speech";
import type { PhonicsSound, PhonicsSoundCategory } from "../../types";
import { Header } from "../../components/shared/Header";
import styles from "./PhonicsGuide.module.css";

/**
 * Plays "the sound itself" for a guide entry. S Blends use the exact same
 * approach as Spin the Wheel's blend-verification step (the letters spoken
 * as one continuous sound, e.g. speak("sp")) so a child hears the identical
 * pronunciation here and in the games. Every other category speaks its
 * reference word instead, since spelling codes like "a_e" or "igh" aren't
 * real pronounceable text on their own.
 */
function playSound(category: PhonicsSoundCategory, sound: PhonicsSound): void {
  if (category.id === "s-blends") {
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
            onToggle={() => setExpandedId((prev) => (prev === category.id ? null : category.id))}
          />
        ))}
      </div>
    </div>
  );
}

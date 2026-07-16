/**
 * Thin wrapper around the browser's SpeechSynthesis API.
 *
 * The PRD calls for "AI-generated speech" per word, but the MVP has no
 * backend/audio pipeline, so we speak everything live via the Web Speech
 * API instead. Every word's `audio` field in words.json already points at
 * a future `snap.mp3`-style file — swapping this module for an <audio>
 * player is the only change needed once real recordings exist.
 */

// Chrome has a long-standing bug where a SpeechSynthesisUtterance with no
// other JS reference can be garbage-collected before it finishes speaking,
// which silently cancels the audio. Keeping one alive here (plus a small
// queue so overlapping calls don't stomp on each other) works around it.
let currentUtterance: SpeechSynthesisUtterance | null = null;

// Deliberately NOT cached across calls: some browsers hand back voice
// objects whose internal reference can go stale (particularly after tab
// visibility changes), which can silently fail to speak with no error
// event at all. Re-querying getVoices() is cheap and avoids that entirely.
function pickVoice(): SpeechSynthesisVoice | null {
  if (!isSpeechSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  // Prefer a friendly-sounding English voice if one is available.
  return (
    voices.find((v) => /en-(US|GB|AU)/i.test(v.lang) && /female|samantha|victoria|karen/i.test(v.name)) ??
    voices.find((v) => /^en/i.test(v.lang)) ??
    voices[0]
  );
}

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function initSpeech(): void {
  if (!isSpeechSupported()) return;
  // Voice lists load asynchronously in most browsers; touch it once so
  // it's warm by the time the first speak() call needs it.
  window.speechSynthesis.onvoiceschanged = () => pickVoice();
  pickVoice();
}

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  onEnd?: () => void;
}

export function speak(text: string, options: SpeakOptions = {}): void {
  if (!isSpeechSupported() || !text) {
    options.onEnd?.();
    return;
  }

  const synth = window.speechSynthesis;

  const doSpeak = () => {
    // Some browsers get stuck "paused" after tab-visibility changes, which
    // silently swallows every future speak() call until resumed.
    synth.resume();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate ?? 0.85;
    utterance.pitch = options.pitch ?? 1.15;
    utterance.volume = 1;
    const voice = pickVoice();
    utterance.lang = voice?.lang ?? "en-US";
    if (voice) utterance.voice = voice;
    utterance.onend = () => {
      if (currentUtterance === utterance) currentUtterance = null;
      options.onEnd?.();
    };
    utterance.onerror = (event) => {
      if (currentUtterance === utterance) currentUtterance = null;
      // Surface this — it was previously swallowed silently, making a
      // real failure indistinguishable from "nothing went wrong".
      console.error("[speech] utterance failed:", event.error, "for text:", JSON.stringify(text));
      options.onEnd?.();
    };

    currentUtterance = utterance; // hold a reference so Chrome can't GC it mid-speech
    synth.speak(utterance);
  };

  // Chrome silently drops speak() if it's called in the same tick as
  // cancel() — a long-standing Web Speech bug. A short delay avoids it.
  if (synth.speaking || synth.pending) {
    synth.cancel();
    setTimeout(doSpeak, 50);
  } else {
    doSpeak();
  }
}

/** Speaks a sequence of sound parts one after another (e.g. ["s", "n", "ap", "snap"]). */
export function speakSequence(parts: string[], options: Omit<SpeakOptions, "onEnd"> = {}): void {
  if (!isSpeechSupported() || parts.length === 0) return;

  const speakNext = (queue: string[]) => {
    if (queue.length === 0) return;
    const [current, ...remaining] = queue;
    speak(current, { ...options, onEnd: () => speakNext(remaining) });
  };

  speakNext(parts);
}

export function stopSpeech(): void {
  if (isSpeechSupported()) window.speechSynthesis.cancel();
  currentUtterance = null;
}

const STRETCHABLE_SOUNDS = new Set(["s", "m", "n", "l", "f", "v", "z", "r"]);

// Stop/plosive consonants (p, t, k, b, d, g, ...) can't be held like "sss"
// can. Respelling them with a trailing vowel ("puh", "tuh") is a common
// TTS workaround, but structured-literacy teaching explicitly avoids adding
// that schwa — "puh-a-tuh" makes blending to "pat" harder, not easier. So
// these are left as the bare letter: a browser TTS voice may render that
// closer to the letter's alphabet name than a true clipped stop sound, but
// that's a lesser problem than teaching the wrong sound outright. Getting
// this fully right needs real recorded phonics audio, not TTS text.
export function stretchSound(letter: string): string {
  const lower = letter.toLowerCase();
  return STRETCHABLE_SOUNDS.has(lower) ? lower.repeat(4) : lower;
}

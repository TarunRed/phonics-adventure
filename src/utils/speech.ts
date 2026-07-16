import audioManifestData from "../data/audioManifest.json";

/**
 * Speaks words/sounds through real, pre-rendered audio files where one
 * exists (generated offline by scripts/generate-audio.mjs into
 * public/audio/, listed in audioManifest.json), falling back to the
 * browser's live SpeechSynthesis API for anything that isn't pre-recorded
 * (free-typed sentences, unknown text). Every caller just calls speak(text)
 * — which path it takes is decided here, transparently.
 *
 * Pre-rendered audio sidesteps a whole category of live-TTS problems this
 * app hit repeatedly: voices reading letters as their alphabet NAME instead
 * of their sound, inconsistent pronunciation across browsers/OSes, and
 * browsers with no/poor installed voices at all. It's the same file for
 * every user, checked in.
 */

const audioManifest = new Set(audioManifestData as string[]);

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

// Only one thing — a live utterance or a pre-recorded clip — should ever be
// audible at once, and starting a new speak() should always interrupt
// whatever's still playing from the last one.
let currentUtterance: SpeechSynthesisUtterance | null = null;
let currentAudio: HTMLAudioElement | null = null;

function stopCurrentAudio(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.onended = null;
    currentAudio.onerror = null;
    currentAudio = null;
  }
}

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

function speakLive(text: string, options: SpeakOptions): void {
  if (!isSpeechSupported()) {
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

export function speak(text: string, options: SpeakOptions = {}): void {
  if (!text) {
    options.onEnd?.();
    return;
  }

  stopCurrentAudio();
  if (isSpeechSupported()) window.speechSynthesis.cancel();

  const slug = slugify(text);
  if (!audioManifest.has(slug)) {
    speakLive(text, options);
    return;
  }

  const audio = new Audio(`${import.meta.env.BASE_URL}audio/${slug}.mp3`);
  audio.playbackRate = options.rate ? options.rate / 0.85 : 1; // pre-rendered at the same 0.85 base rate speakLive uses
  audio.onended = () => {
    if (currentAudio === audio) currentAudio = null;
    options.onEnd?.();
  };
  audio.onerror = () => {
    if (currentAudio === audio) currentAudio = null;
    // The manifest said this file should exist but it failed to load
    // (missing from a stale build, network hiccup, etc.) — fall back to
    // live speech rather than staying silent.
    speakLive(text, options);
  };

  currentAudio = audio;
  audio.play().catch(() => {
    if (currentAudio === audio) currentAudio = null;
    speakLive(text, options);
  });
}

/** Speaks a sequence of sound parts one after another (e.g. ["s", "n", "ap", "snap"]). */
export function speakSequence(parts: string[], options: Omit<SpeakOptions, "onEnd"> = {}): void {
  if (parts.length === 0) return;

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
  stopCurrentAudio();
}

const STRETCHABLE_SOUNDS = new Set(["s", "m", "n", "l", "f", "v", "z", "r"]);

// Stop/plosive consonants (p, t, k, b, d, g, ...) can't be held like "sss"
// can. Respelling them with a trailing vowel ("puh", "tuh") is a common
// TTS workaround, but structured-literacy teaching explicitly avoids adding
// that schwa — "puh-a-tuh" makes blending to "pat" harder, not easier. So
// these are left as the bare letter for live TTS. Pre-rendered audio (see
// above) sidesteps this entirely once a real recording exists for it.
export function stretchSound(letter: string): string {
  const lower = letter.toLowerCase();
  return STRETCHABLE_SOUNDS.has(lower) ? lower.repeat(4) : lower;
}

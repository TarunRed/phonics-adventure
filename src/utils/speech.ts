/**
 * Thin wrapper around the browser's SpeechSynthesis API.
 *
 * The PRD calls for "AI-generated speech" per word, but the MVP has no
 * backend/audio pipeline, so we speak everything live via the Web Speech
 * API instead. Every word's `audio` field in words.json already points at
 * a future `snap.mp3`-style file — swapping this module for an <audio>
 * player is the only change needed once real recordings exist.
 */

let cachedVoice: SpeechSynthesisVoice | null = null;
let voicesLoaded = false;

function pickVoice(): SpeechSynthesisVoice | null {
  if (!isSpeechSupported()) return null;
  if (voicesLoaded && cachedVoice) return cachedVoice;

  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  // Prefer a friendly-sounding English voice if one is available.
  const preferred =
    voices.find((v) => /en-(US|GB|AU)/i.test(v.lang) && /female|samantha|victoria|karen/i.test(v.name)) ??
    voices.find((v) => /^en/i.test(v.lang)) ??
    voices[0];

  cachedVoice = preferred;
  voicesLoaded = true;
  return preferred;
}

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function initSpeech(): void {
  if (!isSpeechSupported()) return;
  // Voice lists load asynchronously in most browsers.
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
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate ?? 0.85;
    utterance.pitch = options.pitch ?? 1.15;
    const voice = pickVoice();
    if (voice) utterance.voice = voice;
    if (options.onEnd) utterance.onend = () => options.onEnd?.();
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
}

/** Stretches a letter sound for blending demos, e.g. "s" -> "sssss". */
export function stretchSound(letter: string): string {
  const stretchable = new Set(["s", "m", "n", "l", "f", "v", "z", "r"]);
  const lower = letter.toLowerCase();
  return stretchable.has(lower) ? lower.repeat(4) : lower;
}

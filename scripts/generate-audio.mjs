#!/usr/bin/env node
/**
 * Generates real, pre-rendered audio files for every word/sound/phrase the
 * app can speak, using the local macOS `say` voice + ffmpeg — no backend,
 * no cloud service, no per-user network dependency. Output goes to
 * public/audio/<slug>.mp3, with a manifest (src/data/audioManifest.json)
 * listing every slug so the app can look files up at runtime without a
 * network probe.
 *
 * Re-run safe: existing files are skipped unless --force is passed.
 *
 * Usage: node scripts/generate-audio.mjs [--force] [--voice=Samantha] [--rate=160]
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const AUDIO_DIR = path.join(ROOT, "public", "audio");
const MANIFEST_PATH = path.join(ROOT, "src", "data", "audioManifest.json");

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const VOICE = (args.find((a) => a.startsWith("--voice=")) || "--voice=Samantha").split("=")[1];
const RATE = (args.find((a) => a.startsWith("--rate=")) || "--rate=160").split("=")[1];

// --- Mirrors src/utils/speech.ts's stretchSound() exactly. Keep in sync. ---
const STRETCHABLE_SOUNDS = new Set(["s", "m", "n", "l", "f", "v", "z", "r"]);
function stretchSound(letter) {
  const lower = letter.toLowerCase();
  return STRETCHABLE_SOUNDS.has(lower) ? lower.repeat(4) : lower;
}

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

async function loadJson(relPath) {
  const raw = await readFile(path.join(ROOT, relPath), "utf-8");
  return JSON.parse(raw);
}

/** Mirrors PhonicsGuide.tsx's playSound() category-mode logic. Keep in sync. */
const CATEGORY_SOUND_MODE = {
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
const SOUND_MODE_OVERRIDE = { "d-ck": "stretch" };

async function collectTexts() {
  const words = await loadJson("src/data/words.json");
  const blends = await loadJson("src/data/blends.json");
  const guide = await loadJson("src/data/phonicsGuide.json");

  const texts = new Set();

  // 1. Every game word.
  for (const w of words) texts.add(w.word);

  // 2. Every word-family ending (spoken during error-escalation hints).
  for (const w of words) texts.add(w.family);

  // 3. Every letter's pure phonics sound, a-z (covers every stretchSound()
  //    call site across Blend Explorer's tile taps and the Guide).
  for (const code of Array.from({ length: 26 }, (_, i) => i + 97)) {
    texts.add(stretchSound(String.fromCharCode(code)));
  }

  // 4. Every S-blend as one continuous unit (Spin the Wheel, Blend Explorer).
  for (const b of blends) texts.add(b.letters.toLowerCase());

  // 5. The "Find a word that starts with X." prompt, once per blend.
  for (const b of blends) texts.add(`Find a word that starts with ${b.letters.toLowerCase()}.`);

  // 6. Every Sounds Guide entry: its "hear the sound" playback text, plus
  //    all 5 practice words, plus the reference word for "word"-mode sounds.
  for (const category of guide) {
    const mode = (id) => SOUND_MODE_OVERRIDE[id] ?? CATEGORY_SOUND_MODE[category.id] ?? "word";
    for (const sound of category.sounds) {
      const m = mode(sound.id);
      if (m === "stretch") {
        const letter = sound.symbol.replace(/\//g, "");
        texts.add(stretchSound(letter));
      } else if (m === "unit") {
        texts.add(sound.spellings[0].toLowerCase());
      } else {
        texts.add(sound.referenceWord.split(",")[0].trim());
      }
      for (const word of sound.practiceWords) texts.add(word);
    }
  }

  return [...texts].filter(Boolean);
}

async function generateOne(text) {
  const slug = slugify(text);
  if (!slug) return { text, slug, status: "skipped-empty" };

  const outPath = path.join(AUDIO_DIR, `${slug}.mp3`);
  if (!FORCE && existsSync(outPath)) return { text, slug, status: "exists" };

  const tmpAiff = path.join(AUDIO_DIR, `.tmp-${slug}.aiff`);
  try {
    await execFileAsync("say", ["-v", VOICE, "-r", RATE, "-o", tmpAiff, text]);
    await execFileAsync("ffmpeg", ["-y", "-i", tmpAiff, "-codec:a", "libmp3lame", "-qscale:a", "3", outPath]);
    return { text, slug, status: "generated" };
  } finally {
    if (existsSync(tmpAiff)) await rm(tmpAiff, { force: true });
  }
}

async function main() {
  await mkdir(AUDIO_DIR, { recursive: true });
  const texts = await collectTexts();
  console.log(`Collected ${texts.length} unique text entries to generate audio for.`);

  const results = [];
  let done = 0;
  for (const text of texts) {
    const result = await generateOne(text);
    results.push(result);
    done++;
    if (done % 25 === 0 || done === texts.length) {
      console.log(`  ${done}/${texts.length} (${result.status}: "${result.text}")`);
    }
  }

  const generated = results.filter((r) => r.status === "generated").length;
  const existing = results.filter((r) => r.status === "exists").length;
  console.log(`Done. Generated ${generated} new files, ${existing} already existed.`);

  const manifest = results
    .filter((r) => r.status !== "skipped-empty")
    .map((r) => r.slug)
    .sort();
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`Wrote manifest with ${manifest.length} entries to ${path.relative(ROOT, MANIFEST_PATH)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

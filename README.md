# Phonics Adventure: S Blend Explorer (MVP)

A web-based phonics game platform for children aged 3–6, teaching S-blend
recognition, sound blending, and word decoding through five short mini-games.
Built as a reusable **phonics platform**, not a one-off game — new blends,
word families, and games are additive changes, not rewrites.

No backend, no auth, no database. All content lives in JSON; all progress
lives in memory for the current browser session.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build       # type-checks then builds to dist/
npm run lint         # oxlint
npm run preview       # serve the production build locally
```

Requires Node 18+. No environment variables or external services needed —
speech is generated live in the browser via the Web Speech API
(`window.speechSynthesis`), so no audio files or API keys are required.

## How a session works

1. **Home** (`src/pages/Home`) — a child taps **Play** (auto-picks a random
   blend) or taps a specific blend tile. A parent/teacher can instead go to
   **Teacher Mode** or **Parent Dashboard**.
2. **Play** (`src/pages/Play`) is the session engine. It calls
   `buildSession()` (`src/utils/sessionBuilder.ts`) once to generate an
   ordered list of *rounds* — each round is `{ game, words }`, where
   `words[0]` is the target word and the rest are distractors. Independent
   sessions cycle through all five games in the PRD's progression order
   (Blend Explorer → Spin the Wheel → Build the Word → Drag Picture →
   Reading Challenge); guided/teacher sessions can lock to a single game.
3. Each round renders the matching game component
   (`src/components/games/*`), which reports back via a single
   `onResult(correct, word, tries)` callback.
4. `onResult` calls `recordAttempt()` on `ProgressContext`
   (`src/context/ProgressContext.tsx`) — the single source of truth for
   stars, accuracy, mastered words, and per-blend performance for the
   current session. Every correct answer earns one star; every 5th star
   triggers the `Celebration` overlay.
5. After the last round, the player lands on **Session Summary**
   (`src/pages/Progress/SessionSummary.tsx`) showing stars, accuracy, words
   mastered, and a suggested next activity.

## Error handling (per the PRD's escalation ladder)

Implemented once in `src/hooks/useErrorEscalation.ts` and reused by every
game that asks a question:

| Wrong answers | Response |
|---|---|
| 1 | Gentle encouragement message |
| 2–3 | Highlight the blend + word family |
| 4–5 | Speak the blend + word family aloud |
| 6+ | Speak the whole word, animate the blend, then let them retry |

## Content model

All phonics content is data, not code — see `src/data/`:

- `words.json` — every word: `{ word, blend, family, emoji, nonsense, audio, difficulty }`.
  81 words across the 8 required S-blends (SC, SK, SL, SM, SN, SP, ST, SW)
  and the PRD's word families (plus `ab`/`em`/`im`, added so the PRD's own
  example words — *scab*, *stem*, *swim* — are reachable). Roughly half are
  real, illustrated words; the rest are decodable "nonsense" words (standard
  practice in phonics instruction) with no emoji.
- `blends.json` — the 8 blends with their letters, component sounds, and a
  theme colour used throughout the UI (blend tiles, Spin the Wheel, game borders).
- `levels.json` — the 5-level progression (Letter Sounds → Blend Recognition
  → Word Family Practice → Picture Matching → Independent Reading), each
  mapped to the game that teaches it.

**To add a new blend or word family:** add entries to `words.json` /
`blends.json` — no component code changes needed, since every game reads
its word list from `GameProps.words` supplied by `sessionBuilder.ts`.

**To swap emoji placeholders for real illustrations:** `PhonicsWord.emoji`
is the only place a picture is referenced; point it at an image path/import
instead of an emoji character and update `EmojiTile`/`LetterChip` rendering.

**To swap browser speech for recorded audio:** `PhonicsWord.audio` already
holds a `word.mp3`-style filename for every word. `src/utils/speech.ts` is
the only module that talks to the Web Speech API — replace its internals
with an `<audio>` player keyed off that field and every game keeps working
unchanged.

## Architecture

```
src/
  components/
    games/            One folder per mini-game (component + CSS module)
      BuildWord/
      DragPicture/
      SpinWheel/
      ReadingChallenge/
      BlendExplorer/
    shared/            Reusable primitives (Button, EmojiTile, LetterChip,
                        AudioButton, HintBubble, StarBadge, Celebration,
                        Header, ProgressDots)
  context/
    ProgressContext.tsx  Session state: stars, attempts, accuracy, mastered
                          words, per-blend accuracy, teacher settings
  data/                words.json, blends.json, levels.json
  hooks/
    useErrorEscalation.ts  The staged hint/retry ladder above
  pages/
    Home/              Mode + blend selection
    Play/               Session engine/orchestrator
    Teacher/            Blend/family/level picker, guided mode, homework
    Parent/              Session-only stats dashboard
    Progress/            SessionSummary (end-of-session recap)
  types/               Shared TypeScript interfaces (PhonicsWord, Blend,
                        GameProps, TeacherSettings, ...)
  utils/
    phonicsData.ts     All reads of words/blends/levels JSON go through here
    sessionBuilder.ts  Builds the round sequence for a session
    speech.ts          Web Speech API wrapper (see "content model" above)
```

Every game is a self-contained component implementing the same
`GameProps` contract (`words`, `blend`, `onResult`, `hintsEnabled`), so
`Play.tsx` can render any of them interchangeably and a sixth game (e.g. for
L blends or digraphs) only needs to satisfy that same contract to plug in.

## Design

Palette, spacing, and type scale are defined once as CSS variables in
`src/index.css` (soft coral/sun/mint/sky/lilac/blush tones, generous
rounded corners, the Baloo 2 display font) and consumed by every component
via CSS Modules — no inline colour values scattered through components.
Layout is mobile-first and touch-friendly (large tap targets, tablet-first
breakpoints, `prefers-reduced-motion` support); interactions are tap-based
rather than fine-motor drag-and-drop, since precise dragging is difficult
for a 3–6 year-old on a touchscreen.

## Known MVP limitations

- Some S-blends (e.g. SC) have very few real English words, so sessions
  focused on that blend lean more heavily on nonsense-word practice or
  reuse the same 1–2 real words — expected to improve simply by adding more
  words to `words.json`.
- Progress/stats are in-memory only and reset on refresh, per the PRD (no
  backend/database in scope for this MVP).
- Speech quality depends on the browser's installed voices; Chrome/Edge
  give the most natural results.

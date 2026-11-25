# What if you folded a sheet of paper 103 times?

YouTube Short · 1080×1920 · 30 fps · 48.1 s · English · voice: edge-tts `en-US-AndrewMultilingualNeural` (+0%)
Episode 2 of `styles/what-if-doubling/recipe.md`.

## The model

- Thickness after **n** folds: **T = 0.1 mm × 2ⁿ** (office paper ≈ 0.1 mm). Layers = 2ⁿ, shown exactly with BigInt.
- A thought experiment: in reality you can't fold paper anywhere near this many times. Every fold also halves the paper's area, which the picture hints at by narrowing the column.
- Each milestone is the **first whole fold** where T passes the reference (the fold before is shown in the last column).

## Milestones (checked in Python)

| n | T = 0.1 mm × 2ⁿ | Reference | Ratio | Fold before | On screen |
|---:|---:|---|---:|---:|---|
| 0 | 0.1 mm | one sheet | 1 | — | One sheet of paper |
| 3 | 0.8 mm | credit card 0.76 mm | 1.05 | 0.53 | ≈ a credit card |
| 7 | 1.28 cm | notebook ≈ 1.2 cm | 1.07 | 0.53 | As thick as a notebook |
| 10 | 10.2 cm | coffee mug ≈ 9.5 cm | 1.08 | 0.54 | ≈ a coffee mug |
| 15 | 3.28 m | ceiling ≈ 2.5 m | 1.31 | 0.66 | Taller than your ceiling |
| 20 | 104.9 m | Statue of Liberty 93 m (with pedestal) | 1.13 | 0.56 | Past the Statue of Liberty |
| 23 | 838.9 m | Burj Khalifa 828 m | 1.01 | 0.51 | Taller than the Burj Khalifa |
| 27 | 13.4 km | Mount Everest 8,849 m | 1.52 | 0.76 | Higher than Mount Everest |
| 30 | 107 km | edge of space (Kármán line) 100 km | 1.07 | 0.54 | You've reached space |
| 42 | 439,805 km | Moon 384,400 km | 1.14 | 0.57 | Past the Moon |
| 51 | 225 million km | Sun 149.6 million km | 1.51 | 0.75 | Past the Sun |
| 56 | 7.2 billion km | Pluto, average 39.5 AU = 5.9 billion km | 1.22 | 0.61 | Beyond Pluto |
| 69 | 6.24 light-years | Proxima Centauri 4.24 ly | 1.47 | 0.74 | To the nearest star |
| 83 | 102,200 ly | Milky Way ≈ 100,000 ly across | 1.02 | 0.51 | Across the Milky Way |
| 88 | 3.27 million ly | Andromeda 2.5 million ly | 1.31 | 0.65 | Past the Andromeda galaxy (not narrated) |
| 103 | 107 billion ly | observable universe 93 billion ly across | 1.15 | 0.58 | Wider than the universe |
| 104–106 | 214–857 billion ly | — | 2.3× / 4.6× / 9.2× | | ≈ N× the universe (end) |

2¹⁰³ exactly = 10,141,204,801,825,835,211,973,625,643,008 layers.

## Beats (word timings from `audio/timeline.json`)

The fold count hits each milestone on the first word of its line, and the camera arrives on that word (0.75 s before → 0.1 s after, power2.inOut on log scale).

| Video time | Folds n | Camera (px per metre) | Narration |
|---|---|---|---|
| 0–5.1 | 0 → 2 | 60,000 (one sheet = 6 px, credit card beside it) | How many times would you have to fold a sheet of paper to cross the entire universe? |
| 5.1–7.7 | 2 → 7 | | Every fold doubles its thickness. |
| 7.74 | 7 | 25,000: notebook | Seven folds: as thick as a notebook. |
| 10.83 | 15 | 115: mug, person, ceiling | Fifteen: taller than your ceiling. |
| 13.30 | 23 | 0.345: Statue of Liberty, Burj Khalifa | Twenty-three: taller than the Burj Khalifa. |
| 16.36 | 27 | 0.0316: Everest, airliner at 11 km | Twenty-seven: higher than Mount Everest. |
| 19.42 | 30 | 0.0026: Kármán line, atmosphere | Thirty: you've reached space. |
| 21.75 | 42 | Earth + Moon | Forty-two: it passes the Moon. |
| 24.20 | 51 | Sun | Fifty-one: it's past the Sun. |
| 26.52 | 56 | Pluto | Fifty-six: beyond Pluto. |
| 29.31 | 69 | Proxima Centauri | Sixty-nine: it reaches the nearest star. |
| 32.55 | 83 | Milky Way disc | Eighty-three: across the entire Milky Way. |
| 35.4 | 88 | Andromeda (no voice) | — |
| 35.77–38.27 | 86 → 103 | universe circle; riser | And at one hundred and three folds... |
| 38.27 | 103 | the column crosses the observable universe; bass hit | it's wider than the observable universe. |
| 41.27–48.09 | 103 → 106 | camera keeps pulling out: the universe shrinks to a dot | One sheet of paper. That's the power of doubling. What should we double next? |

## Sound

Voice (loudnorm −14.5 LUFS, clip volume 0.8). Bundled SFX: pops on folds 1 and 2, whooshes on the camera moves, a riser peaking on "it's wider…", and a bass hit. No music (needs a HeyGen sign-in).

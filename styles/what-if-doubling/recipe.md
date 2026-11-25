# Recipe: "What if X doubled every second?" (scale simulation Short)

Niche #3 in `NICHES.md`. First episode: `videos/2026-11-24-rice-doubling/` (rice → bigger than the Sun in 116 s).
Built with `/hyperframes` only (no REV: its 3D render hangs in the cloud session). Free tools only.

## The style in two lines

A dark, clean vertical frame. One huge counter that never stops climbing (exact 2^t), with a one-line comparison under it ("≈ a full bathtub") and the real volume. Above it, a flat-vector picture of the thing being filled, and the camera zooms out to a bigger world on every narrated milestone.

## Format

- 1080×1920, 30 fps, 45–55 s, English voice + English on-screen text. No captions track: the comparison line is the caption, and it changes on the spoken word.
- Frame 0 = the hook: the question as a title ("What if one grain of rice doubled every second?"), the single object, and the counter at 1.
- Ends on a question ("What should we double next?") to pull comments.

## Layout (px, 1080×1920, everything inside the Shorts safe zone x 120–888, y 288–1248)

| y | Element |
|---|---|
| 296–360 | Sim clock pill: clock icon + "23 SECONDS" (simulated seconds). The hook title sits here for the first 3.2 s, the outro lines for the last 6 s. |
| 370–800 | The art band: one SVG "world", masked so nothing passes below y≈800 (otherwise the incoming zoom washes over the counter). |
| 800–838 | "GRAINS OF RICE · 2ⁿ" (28 px, letter-spaced grey) |
| 842–1042 | The counter. League Gothic, tabular numbers, white with a warm glow. Up to 12 digits: the full number with commas (size ≈ 680 / (digits×0.44 + commas×0.2), max 230 px). Past that: 3 significant digits (158 px) + the name in amber (TRILLION … UNDECILLION). |
| 1046–1114 | Past 10¹²: the exact digits in Space Mono 28 px, breaking only after commas. |
| 1124–1175 | The comparison, Inter 900 uppercase amber (44 / 40 / 36 px by length). |
| 1182–1220 | The volume in Space Mono (cm³ → liters → m³ → million/billion m³ → a.b × 10ⁿ m³). |
| 1320 | Decoration in the app-UI zone: a progress track (sim seconds / end), ticks at milestones, glowing dot. No text there. |

Palette: ground radial `#161d33 → #07080e`, ink `#fff`, accent `#ffb84d`, lines `#8b97bd`, rice `#efe3c6` with a 26×22 grain pattern.

## The maths (do this first, write `scenes.md`)

1. Count N = 2^t. Volume = unit × 2^t (rice: 0.03 cm³ bulk per grain).
2. For every reference, take the **first whole second** where the volume passes it, and print the ratio. Keep ratios between about 1.0 and 1.8 so "fills a …" / "bigger than …" stays honest; skip a reference that only fits at 2–3×.
3. Pick 8–11 narrated milestones from everyday → city → planet → star. Useful volumes: handful 30 mL · cup 250 mL · bowl 0.5 L · bucket 12 L · bathtub 250 L · kitchen 30 m³ · house 500 m³ · Olympic pool 2,500 m³ · Great Pyramid 2.6 M m³ · Manhattan 59.1 km² of land · Earth's surface 5.1 × 10¹⁴ m² · Earth 1.083 × 10²¹ m³ · Jupiter 1.43 × 10²⁴ m³ · Sun 1.41 × 10²⁷ m³.
4. Put the table (t, N, volume, reference, ratio, on-screen line) in `scenes.md` before building.

## Script and voice

- One line per milestone, number first: "Twenty-three: enough to fill a bathtub." Hook ≤ 5 s. Payoff split in two with a 0.8 s pause ("And at one hundred and sixteen seconds…" / "it's bigger than the Sun."). About 120 words gives ~49 s.
- `audio/script.json` → `tts.py` (edge-tts, `en-US-AndrewMultilingualNeural`, rate `+2%`, gaps 0.4 s, `trim: true`):
  ```bash
  export SSL_CERT_FILE=/root/.ccr/ca-bundle.crt   # cloud session: edge-tts must trust the proxy CA
  .claude/skills/reverse-engineer-video/.venv/bin/python .claude/skills/reverse-engineer-video/scripts/tts.py \
    videos/<dir>/audio/script.json videos/<dir>/audio en-US-AndrewMultilingualNeural "+2%"
  ffmpeg -y -i audio/voice.wav -af loudnorm=I=-14.5:TP=-1.5:LRA=11 -ar 48000 assets/voice.wav
  ```
- `audio/timeline.json` gives each word's start. The **first word of each line** is the anchor: sim time hits that milestone, and the camera arrives, exactly on it.

## How the composition works (copy `compositions/sim.html`)

- One scene, `sim`, drawn by a pure `render(v)` function called from `tl.eventCallback("onUpdate", …)` on a paused timeline with one driver tween over the full length. Every frame depends only on `v`, so out-of-order frames render correctly.
- `ANCH = [[v, t], …]`: piecewise-linear video time → sim seconds (hold at 0 for the first 0.6 s, then each anchor word; last point = end of video, a few seconds past the payoff so the counter never stops).
- `ARRIVE = [v…]`: camera stage k arrives on its anchor word. `z = Σ ease((v − (a − 0.75)) / 0.85)` (power2.inOut). Stage k is drawn at `scale = 5^(k − z)` around the art centre; incoming opacity `(1+d)^1.6`, outgoing `1 − 1.25d`.
- Each container fills by **volume ratio** `f = 2^(t − t_full)`: a clipped rice rect for f ≤ 1, then a half-dome heap above the rim (ry ≤ 70–80 px; bigger heaps look like blobs). Pyramid: fill height `1 − (1−f)^(1/3)`, then a rice cone capped at 1.25× that buries it, with the outline dashed on top. City: depth in metres × px/m, capped below the clock.
- Space is one continuous stage in Earth radii, all circles concentric: ball `r = cbrt(1 + V/V_earth)`, camera `P = min(165, 205/r)` px per Earth radius, Jupiter ring 10.97 P, Sun 109.1 P (outline while it's bigger than the ball, a glowing disk inside the ball once it's smaller). This gives a natural zoom-out from Earth to the Sun.
- Counter values are exact with `2n ** BigInt(n)`. A small 7% pop on each doubling while they are ≥ 0.25 s apart.
- Comparison label = the last reference passed (`CMP` list). Each blurs in (8 px → 0, 0.2 s) at the moment sim time crosses it.
- Seeded `mulberry32` for grains, stars and windows. Generated SVG (grains, buildings, stars, ticks) is built once at init.

## Sound

- Voice is the clock. Bundled HyperFrames SFX (no credit needed): whoosh / whoosh-short alternating on each zoom, start = arrival − 0.45 s, volume 0.24–0.32; `riser.mp3` peaks at 3.47 s into the file (not at its end), so start it at payoff − 3.44 s, volume 0.22, fade 1.2 s; `impact-bass-1` on the payoff word (start −0.03 s), 0.4; `pop` on "It doubles".
- No music bed: the free HeyGen music catalog needs `npx hyperframes auth login`. Once signed in: `media-use resolve --type bgm --intent "curious ambient pulse building, 100 bpm"` at ~0.12.
- Target loudness −14 to −16 LUFS, true peak ≤ −1 dB (`npx hyperframes audio final.mp4 --json`). Episode 1: voice loudnorm −14.5 plus `data-volume 0.8` on the voice clip.

## Work loop

`check --json --safe-zone shorts` → `snapshot --at …` (look at the milestones AND mid-zoom times such as arrival − 0.3 s) → `render --quality draft` (~3 min) → pull 5 frames with ffmpeg and look → `render --quality delivery` (~3.5 min) → ffprobe + loudness.

## Reusable prompt for the next episode

> Make a YouTube Short with `styles/what-if-doubling/recipe.md`: "What if **[one X]** doubled every second?" Unit size: **[volume/mass of one X, with source]**. Journey: **[5–9 milestones up to the punchline]**. Copy `videos/2026-11-24-rice-doubling/`, recompute the milestone table in `scenes.md`, rewrite `audio/script.json`, re-run tts, update `ANCH`, `ARRIVE`, `STAGE_T`, `CMP` and the stage art, then check → draft → frames → delivery.

Episode ideas: a single bacterium; a $1 bill (stacked height); a drop of water; a sheet of paper folded (thickness); a Lego brick; a pixel; one ant; one penny.

## Lessons from episode 1

- edge-tts pins `certifi` and fails behind the session's TLS proxy. `tts.py` now trusts `SSL_CERT_FILE` when it is set (verification stays on).
- The incoming zoom stage (5× size, semi-transparent) washed over the counter for ~0.4 s. Fix: an SVG mask on the art band that fades to nothing at y 780–825.
- Overflow heaps grown as full ellipses turned into huge blobs. Use half-domes with a small cap.
- The first take was 41.7 s. Slower rate (+2%), 0.4 s gaps and one extra milestone brought it to 49.3 s.
- Sim time is not real time after the first beats. Show a "SECONDS" clock so viewers see it's simulated, and make sure no non-narrated label (e.g. Jupiter) lands while the voice is still saying the previous one.
- `fmtVol` rounding produced "10.0 × 10²⁷". Carry the rounding into the exponent.

## Episode 2: paper folding (`videos/2026-11-24-paper-folding/`)

A variant for anything that grows in **length** (height, distance), not volume. Copy this project instead of the rice one when the punchline is a distance.

- Model: T = 0.1 mm × 2ⁿ, n = folds. The clock pill says "23 FOLDS", the counter shows the thickness with its unit as the name line (MILLIMETERS → … → BILLION LIGHT-YEARS), and the digits line shows the exact layer count 2ⁿ.
- **One continuous scene, no stage groups.** Everything is in metres, drawn on screen as `ground_y − height × P`, where P (px per metre) moves on a log scale between camera stops (`CAM = [[arrival, P], …]`, each stop ≈ 300 px / reference height). References sit beside the paper at true height: card, notebook, mug, person + ceiling, Statue of Liberty, Burj Khalifa, Everest + airliner, Kármán line + atmosphere, Moon, Sun, Pluto, Proxima, Milky Way, Andromeda, the observable universe. Each fades by its on-screen size (`vis(px, lo, hi)`), so the zoom-out feels continuous.
- The sub-line under the comparison gives the reference's real size ("Burj Khalifa: 828 m"), so the frame carries both numbers.
- The paper column narrows as it folds (width × 2^(−n/2)). While folds are slow (< 2 per second) it snaps fold by fold in 0.35 s; faster than that it grows continuously.
- After the payoff the camera keeps pulling back so the universe shrinks to a dot next to the paper (P = min(P_cam, 330 px / T)).

Lessons:
- **Hide what is invisible.** A shape with opacity 0 but a 10¹² px radius (the universe circle during the star stage) made Chrome's screenshot time out. `show()` sets `display:none` when opacity is 0, and radii are capped at 5,000 px.
- Counter box is 200 px: number ≤ 150 px + unit line ≤ 48 px, or the unit runs into the digits line.
- Keep big reference objects out of the hook frame (notebook at 150,000 px/m covered the title). Cap each one with `vis(…, hi)`.
- Outro lines need ≥ 1.3 s on screen (`line_unread`): start the first one ~0.4 s before its word, and fade the clock pill earlier.

## Episode 3: the rumor (`videos/2026-11-24-rumor/`)

A variant for **counts of people or things** (no physical size). Copy this project when the thing that doubles is a number of items.

- Model: every minute, everyone who knows tells one new person, so N = 2^m. It stops at the world (2³³ = 8.59 billion > everyone alive), and the counter becomes "EVERYONE".
- **Self-similar dot zoom:** a 32 × 32 grid (1,024 dots). When it fills, the camera zooms ×32 and the whole grid becomes one dot (1 dot = 1, 1,024, 1,048,576). The last stage is a disc of 978 dots ≈ the world (1 dot = 2²³ ≈ 8.4 million), and the stage-2 grid shrinks into the 128 dots it equals (×3.1). `POS` holds each stage's log scale, `camC(v)` eases between them, and stage scale = exp(POS[k] − C).
- Dots light from the centre outward (distance + a little seeded jitter). The newest half glows brighter, which shows the key insight: half of everyone who knows heard it in the last minute. The new ones sweep in over 0.3 s while the minutes are slow.
- Only circles whose state changed get touched (`state` array). That keeps ~4,000 dots cheap per frame.

Lessons:
- Incoming grids at ×32 show giant dots: fade them in with power 3, keep unlit dots dark (#1d2439), and mask the art to y ≥ 400 so nothing sits under the hook title.
- `dead_stretch`: a still opening over 3 s gets flagged. Start doubling on the first noun ("rumor") and add one motivated ripple from patient zero.
- Pops 0.6 s apart overlap (`duplicate_audio_track`). Keep pops ≥ 0.75 s apart, or skip some.
- Space Mono has no superscript digits (2³³ renders as "2' '"). Keep superscripts in Inter only.
- Pick milestone references whose population sits between 0.5× and 1× of 2^m at the minute before. NYC (8.8 M) fails at 2²³ (8.39 M), so check every population against the exact power of two.

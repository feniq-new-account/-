# Recipe: "What if X doubled every second?" (vertical Short)

First episode: `videos/2026-11-25-rice-doubling/` (rice grain → Sun → universe), 49 s. Rendered 2026-11-25, all free.

## Format
- 1080×1920, 30 fps, 45–55 s, English.
- Hook at frame 0: the single object, the counter reading "SECOND 0 / 1" and a gold tag ("×2 EVERY SECOND"). The question ("How long until it swallows the Sun?") comes at ~4 s.
- One stage every ~4.5 s. The counter jumps (a fast roll over 0.8 s), the stage zooms in from 1.7× and drifts out to 0.9×, then exits shrinking to 0.3× (a "camera pulling back" feel).
- A rice floor rises one step per stage below the safe band. This is texture only, and it doubles as a progress bar.

## Layout (safe band from `hyperframes check`)
- Every word sits inside y 288–1248 and x 120–888 (x ≤ 780 below y 840).
- Counter: y 296. Tag: y 536 (Oswald 54). Art: 520 px SVG at y 600. Caption: y 1134 (Inter 700, 36 px, words brighten as spoken).
- Nothing readable under 28 px. Text inside the SVG is scaled 0.578, so it needs ≥ 50 units.

## Look
- Background: radial navy #13203d → #070b16; space stages switch to #02030a.
- Rice: an SVG pattern (cream #e6dab9 + grains). Gold #ffb347 for labels. White numerals in Archivo Black. Space Mono for "SECOND n".
- Big numbers: exact with commas < 2^20; million…quintillion up to 2^59; then m.mm×10ⁿ.

## Sound (free)
- Voice: HyperFrames `tts` (Kokoro, local), voice `am_michael`, speed 1.05, one wav per line, laid out with gaps of 0.45–0.8 s.
  edge-tts does NOT work in the cloud session (WebSocket blocked by the proxy).
  Kokoro needs `HYPERFRAMES_PYTHON=<venv>/bin/python` with `kokoro-onnx soundfile` installed.
- Bed: `sound.py` (numpy). A low A drone that swells, a whoosh 0.55 s before each stage, and soft ticks during the hook doubling. Mixed with ffmpeg and loudnorm to I=-14 (measured −16.5 LUFS).

## Pipeline
1. `lines.json` (narration) → tts per line → `timeline.json` + `assets/voice.wav`.
2. `scenes.md`: every number checked (2^t × 0.03 cm³ per grain). Fix the second if the comparison isn't true. This happened 3 times in episode 1: pyramid 46→47, harvest 54→55, Sun 115→116.
3. `python3 build.py` → `index.html`. Then `check --json`, `snapshot --at …` and look at a contact sheet.
4. `render --quality delivery -o final.mp4` (~2.5 min on 4 CPUs).

## Next episodes (same template, change the object + comparisons)
- What if your money doubled every day?  (1 day → coffee → car → house → Musk → world GDP)
- What if a sheet of paper doubled in thickness every fold? (→ Moon → Sun)
- What if bacteria doubled every 20 minutes?
- What if your followers doubled every second? (→ the whole Earth)

## Lessons
- 2026-11-25: always verify that a comparison is TRUE at the stated second before recording the voice.
- 2026-11-25: the stage art must start visible at frame 0 (no fade-in on the first stage). Frame 0 is the thumbnail.

---
name: invitation-video
description: Design and render Arabic wedding / engagement / event invitation videos (vertical 1080x1920 MP4 for WhatsApp and Instagram stories) with gold calligraphy, flowers, lace, opening-door intros and the person's own music. Use when the person sends invitation text or a photo of an invitation and asks for a video, "دعوة", "فيديو دعوة", "كرت عرس", "بطاقة زفاف", "نزّل المعلومات عالفيديو", or wants a new design or more style options for one.
---

# Invitation video (دعوات فيديو)

Each video is an HTML page animated with CSS. `scripts/render.mjs` captures it frame by frame
with Playwright, then encodes it with ffmpeg and lays the music under it. Two finished templates
live in `templates/`. `references/styles.md` is a catalogue of further looks to offer and build.

## What this person likes (keep to it)

- **Length 30–40 s, calm pacing.** Their words: "ما بدي ياه سريع". Default `--duration 40 --slow 1.7`.
  At that speed the reveals end around 22 s, and the full card then stays on screen so guests can read it.
- **Music** is usually supplied by them. Trim it to the video length and fade out the last 3.5 s.
  Never cut the video short to fit the song, and never speed the video up to fit it.
- **Vertical 1080x1920**, Arabic RTL, groom and his family on the **right**, bride and her family on the **left**.
- Keep their wording exactly. If you add or drop a word (e.g. "مساءً", or a no-photography line),
  say so in the reply.

## Work loop

1. **Collect the text** into a data JSON (copy `examples/mohammad-sireen.json`; every key in it is used).
   When they send a photo of an old invitation plus new text, the photo is the layout reference and the text is the content.
   Check the weekday against the date (e.g. 16/12/2026 = الأربعاء) and flag a mismatch.
2. **Offer options before rendering the full video.** Give 2–3 looks. Use the ready templates and/or
   styles from `references/styles.md`. Show a still of each, side by side:
   ```bash
   node scripts/render.mjs --template emerald-arch --data d.json --out OUT --preview 30
   node scripts/render.mjs --template lace-classic --data d.json --out OUT --preview 30
   ffmpeg -y -i OUT/emerald-arch-preview-30s.png -i OUT/lace-classic-preview-30s.png \
     -filter_complex "[0]scale=540:-1[a];[1]scale=540:-1[b];[a][b]hstack" OUT/options.jpg
   ```
   `--preview` takes video seconds, after `--slow` is applied.
3. **Render** the chosen look:
   ```bash
   node scripts/render.mjs --template emerald-arch --data d.json --out OUT \
     --music song.mp3 --duration 40 --slow 1.7
   ```
   This writes `OUT/<template>.mp4` and `OUT/<template>-poster.jpg`. A 40 s render takes about 2 minutes with 3 workers.
4. **Check** 3 frames: the intro, the middle of the reveal, and the end. Read them as images
   before sending. Look for clipped text, overlap with the flowers or lace, and wrong right/left order.
5. Send the MP4 and the poster. List what you changed or assumed.

## Templates

| name | look | intro |
|---|---|---|
| `emerald-arch` | ivory paper, gold arch frame that draws itself, blush/ivory roses + eucalyptus, gold dust | emerald doors with an Islamic star lattice, gold wax-seal monogram, doors swing open with a light burst |
| `lace-classic` | white embossed 3-D lace borders with pearls, soft grey paper, gold text | fade-up of each line |
| `pink-palace` | photo-real blush-pink palace ballroom (AI plate in `templates/assets/`), rosewood text, scroll ornaments, falling petals, light rays, slow dolly-in | carved pink doors open outward → camera flies through → **page 1** (verse, families, names) → fades → **page 2** (مكان/ساعة/تاريخ medallions, notes, closing). Timed natively for 40 s: render with `--slow 1 --duration 40` |
| `palace-3d` | **all code, no images**: the same pink palace built as a real 3-D scene (Three.js). Columns, arcades, vault, 4 crystal chandeliers, rose urns, blossom branches, a reflective marble floor, curtains, petals and bloom. Needs the sibling `code-video` skill (lib/three) | 3-D doors swing open toward the camera → fly-through → two text pages. Render with `--slow 1 --duration 40`; about 2 s/frame, so run it in the background |

All share the data keys in the example JSON; each ignores the keys it has no slot for. `pink-palace` also uses `place_label`, `time_label`, `date_label`.

Photo-real plates (halls, doors) are made with an image model (e.g. ElevenLabs `creative_generate_image`, gpt-image, aspect 9:16, 2K). Prompt for strict symmetry, a calm centre for the text, and no text or people. For doors, ask for the seam exactly on the vertical centre, then measure the door opening on a grid before cutting it out (see `.frameImg` / `.door` in `pink-palace.html`). Save plates as 1080x1920 JPG in `templates/assets/`.

## Building a new template

For anything 3-D or procedural, read the `code-video` skill first (page contract, Three.js recipes, pitfalls).

Start from a copy of the closest template, then keep these rules:

- Every animation is a CSS animation or a Web Animation with a delay. `window.seek(t)` pauses
  all of `document.getAnimations()` and sets `currentTime`, which makes rendering deterministic.
  Don't use `requestAnimationFrame` loops, `setTimeout`, video elements or real-time JS.
  Looping effects (dust, shimmer) use `infinite` plus negative delays.
- Text goes in `{{key}}` placeholders. Add new keys to the example JSON.
- Fonts come from `fonts/` (OFL): Amiri Quran for verses, Aref Ruqaa for names and headings,
  Noto Naskh Arabic for body text, Amiri as fallback. Load nothing from the network at render time.
- Gold text uses `background-clip:text` on the element that holds the text itself.
  A clip-path on a child does not hide a background painted by its parent.
- Don't name a global `top`, `name`, `status` or `parent` in page scripts. These clash with `window` and silently kill the script.
- A mirrored decoration (`scaleX(-1)`) needs `transform-origin` at its centre, or it flips off-screen.
- An SVG gradient on a straight horizontal or vertical line needs `gradientUnits="userSpaceOnUse"` or a flat colour.
  The default bounding-box gradient makes the line disappear.
- Leave about 150 px free at the top and bottom for the WhatsApp/Instagram UI.

## Requirements

`node`, global `playwright` with Chromium, and `ffmpeg`. In Claude Code cloud sessions all three are preinstalled.

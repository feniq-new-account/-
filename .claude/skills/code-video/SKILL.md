---
name: code-video
description: Make videos entirely from code (no stock footage, no AI images). Covers HTML/CSS/SVG motion graphics, Canvas, and real 3-D scenes with Three.js/WebGL (palaces, halls, rooms, products, camera fly-throughs, particles, glow), rendered frame-exact to MP4 with Playwright and ffmpeg. Use when the person says "صمم الفيديو بالكود", "make it in code", or "3D", wants a procedural or animated background, or when image/video generators are out of credits.
---

# Videos made from code

A video is a web page that can draw any moment on demand. The renderer asks it for time *t*,
takes a screenshot, and repeats this 30 times per second. ffmpeg then joins the frames and adds the music.
Because nothing runs in real time, a slow scene (software WebGL, about 2 s per frame) still gives a smooth video.

Pieces:
- `lib/three/`: Three.js r170 (MIT), plus the addons used most (postprocessing, environments, utils, geometries, objects).
- The renderer is `../invitation-video/scripts/render.mjs`. It handles any page that follows the contract below.
  `--data` is optional; `{{keys}}` are filled from it when given.
- `references/three-recipes.md`: proven 3-D techniques and the pitfalls already hit. **Read it before building a 3-D scene.**
- Worked example: `../invitation-video/templates/palace-3d.html` + `templates/assets/palace-3d.js`.
  It is a pink palace built 100% in code: doors that open, a fly-through, columns, chandeliers, rose urns,
  a reflective marble floor, petals and bloom. Arabic text layers sit on top.

## Page contract

```html
<canvas id="gl"></canvas>                       <!-- optional 3-D layer, CSS-sized to 1080x1920 -->
<div class="page">…HTML/SVG text with CSS animations…</div>
<script type="importmap">{"imports":{"three":"./lib/three/three.module.min.js","three/addons/":"./lib/three/addons/"}}</script>
<script>
  window.__ready = false;                       // set true once the scene is built (the renderer waits for it)
  window.seek = (t) => {                        // must draw time t completely and synchronously
    for (const a of document.getAnimations()) { a.pause(); a.currentTime = t * 1000; }
    window.render3d?.(t);
  };
</script>
<script type="module" src="assets/scene.js"></script>   <!-- defines window.render3d(t), sets __ready = true -->
```

Rules:
- Everything that moves is a **pure function of t**: CSS animations with delays, or `render3d(t)`.
  Never use `requestAnimationFrame` loops, `Date.now()`, `Math.random()` (use a seeded RNG), video tags, or physics that steps.
- Put text in the DOM, not in WebGL. It stays sharp at 1080x1920 while the 3-D canvas renders smaller
  (e.g. 720x1280) and is upscaled by CSS. Bloom and fog hide the softness.
- The renderer serves the build folder over HTTP, because ES modules don't load from `file://`. It copies `fonts/`, `templates/assets/` and
  `lib/` next to the page, and launches Chromium with SwiftShader WebGL flags.

## Commands

```bash
R=.claude/skills/invitation-video/scripts/render.mjs
# stills first (seconds of final video); --slow 1 when the template is timed natively
node $R --template path/or/name --data d.json --out OUT --slow 1 --preview 1,7,21,38
# full render (about 2 s/frame for 3-D at 720x1280 on 4 CPU cores; 40 s at 30 fps takes 20-40 min, so run it in the background)
node $R --template palace-3d --data d.json --out OUT --slow 1 --duration 40 --workers 4 --music song.mp3
```

To debug a 3-D layer, expose objects (`window.__three = {scene, …}`), hide the DOM layers with
`page.addStyleTag({content:'.page,.veil,.white{display:none!important}'})`, and screenshot a few times.
Toggle suspects one by one: floor, fog, bloom, sprites. When the picture doesn't change, the culprit is something you haven't toggled yet.

## Making it good

- Plan the shots on a timeline first: establishing shot, the event (doors open), a fly-through, then a slow drift while the text reads.
  The camera uses Catmull-Rom tracks over `[t, value]` keys, so speed changes smoothly.
- Light for mood. Use a hemisphere light plus a warm key from the back, and point lights in the chandeliers.
  HDR emissive (colour > 1) only on things that should glow, then bloom with threshold 1.0. Use exponential fog in the palette colour for depth.
- Use instances for richness: thousands of roses, crystals, blossoms and petals as `InstancedMesh`.
- Use reflections: a mirror copy of the world under a semi-transparent marble floor costs one extra draw, and needs no Reflector pass.
- Check stills at 3–5 times before the long render. Look for washed-out frames, empty regions and text contrast.

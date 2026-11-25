# Money Math — YouTube Shorts style (EN)
Two people, same money, one difference → chart of both → two counters → red "cost" stamp → CTA.
- 1080×1920, ~27 s, 8 voice lines (hook, people, setup, difference, result B, result A, gap, CTA).
- Look: navy-black bg, mint #3DDC97 = smart choice, coral #FF6B6B = costly choice, gold #FFD43B word highlight. Archivo Black numbers, Inter text.
- Voice en-US-AndrewNeural (edge-tts, certifi→/root/.ccr/ca-bundle.crt), music+sfx score.py.
- Word-by-word captions at y≈1380 (inside Shorts safe area), small disclaimer on the end card.
## New episode (≈10 min)
1. Copy videos/_money-math/ep*_*.py, change lines + numbers (compute in Python, never by hand).
2. `python3 videos/_money-math/gen.py epX.py` → project in videos/<slug>/
3. check → snapshot → render (see hyperframes skill).
## Lessons
- Long lines: captions split at sentence ends (≥5 words).
- Chart under the stamp must fade to 0 (overlap lint).
- Tags need `white-space: nowrap`.

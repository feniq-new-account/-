# How fast can a rumor reach the whole world?

YouTube Short · 1080×1920 · 30 fps · 48.2 s · English · voice: edge-tts `en-US-AndrewMultilingualNeural` (−2%)
Episode 3 of `styles/what-if-doubling/recipe.md`.

## The model

- Rule: every minute, everyone who knows the rumor tells **one new person** (who didn't know it). So the number who know **doubles every minute: N = 2^m**.
- An idealised model: real rumors hit people who already heard them, people sleep, and so on. The point is the speed of doubling, not a forecast.
- Each milestone is the **first whole minute** where N passes the reference (the minute before is under it).
- Side fact shown on screen: since N doubles each minute, at any moment **half of the people who know heard it in the last minute**.

## Milestones (checked in Python)

| m | N = 2^m | Reference | Ratio | Minute before | On screen |
|---:|---:|---|---:|---:|---|
| 0 | 1 | one person | | | Just you |
| 1 | 2 | | | | You + one friend |
| 5 | 32 | classroom ≈ 30 | 1.07 | 0.53 | A whole classroom |
| 10 | 1,024 | school ≈ 1,000 | 1.02 | 0.51 | Your entire school |
| 13 | 8,192 | small town ≈ 8,000 | 1.02 | 0.51 | A small town |
| 16 | 65,536 | stadium ≈ 60,000 seats | 1.09 | 0.55 | A packed stadium |
| 20 | 1,048,576 | a city of 1 million | 1.05 | 0.52 | A whole city |
| 25 | 33,554,432 | Australia ≈ 27.6 million | 1.22 | 0.61 | All of Australia |
| 27 | 134,217,728 | Japan ≈ 123.5 million | 1.09 | 0.54 | Everyone in Japan |
| 29 | 536,870,912 | European Union ≈ 449 million | 1.20 | 0.60 | The entire EU |
| 31 | 2,147,483,648 | India ≈ 1.46 billion | 1.47 | 0.74 | More than India |
| 32 | 4,294,967,296 | India + China ≈ 2.87 billion | 1.50 | 0.75 | More than India + China (not narrated) |
| 33 | 8,589,934,592 | world ≈ 8.2–8.3 billion | 1.04 | 0.52 | Everyone on Earth |

## The picture

A 32 × 32 grid of dots (1,024). Lit dots spread out from the centre; the newest half glows brighter.

| Stage | 1 dot = | Grid full at | Camera arrives on |
|---|---|---|---|
| 0 | 1 person | m = 10 (your school) | frame 0, zoomed in ×7 on the first dot and pulling back as N grows |
| 1 | 1,024 people (the whole stage-0 grid) | m = 20 (a city of a million) | "Thirteen" (13.43 s) |
| 2 | 1,048,576 people | m = 30 | "Twenty-five" (21.02 s) |
| 3 | 2²³ ≈ 8.4 million people (≈ one New York) | the world disc: 978 dots ≈ 8.2 billion | "Thirty-one" (29.45 s) |

Each zoom-out shrinks the full grid into the centre dot of the next one (×32). The last zoom shrinks the stage-2 grid into the 128 dots it equals on the world disc (×3.1).

## Beats (word timings from `audio/timeline.json`)

| Video time | m | Narration |
|---|---|---|
| 0–7.1 | 0 → 3 | One person hears a rumor. Every minute, everyone who knows it tells one new person. How long until the whole world knows? |
| 8.28 | 5 | Five minutes: your whole classroom. |
| 11.08 | 10 | Ten: your entire school. |
| 13.43 | 13 | Thirteen: a small town. (zoom: 1 dot = 1,024) |
| 15.54 | 16 | Sixteen: a packed stadium. |
| 18.20 | 20 | Twenty: a city of a million people. |
| 21.02 | 25 | Twenty-five: all of Australia. (zoom: 1 dot ≈ 1 million) |
| 23.62 | 27 | Twenty-seven: everyone in Japan. |
| 26.24 | 29 | Twenty-nine: the entire European Union. |
| 29.45 | 31 | Thirty-one: more people than live in India. (zoom: the world) |
| 32.50–35.20 | 31 → 33 | And at thirty-three minutes... (riser) |
| 35.20 | 33 | every single person on Earth has heard it. (whole disc lit, bass hit) |
| 38.10–48.18 | 33 | Half an hour. And at every moment, half of them just heard it. That's the power of doubling. What should we double next? |

## Sound

Voice (loudnorm −14.5 LUFS, clip volume 0.8). Bundled SFX: pops on the first doublings, whooshes on the three zoom-outs, a riser peaking on "every single person", and a bass hit. No music.

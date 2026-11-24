# What if a single grain of rice doubled every second?

YouTube Short · 1080×1920 · 30 fps · 49.3 s · English · voice: edge-tts `en-US-AndrewMultilingualNeural` (+2%)

## The model

- Grains after **t** simulated seconds: **N = 2^t** (exact integer, drawn with BigInt on screen).
- One grain of rice, bulk (with the air between grains): **0.03 cm³** (≈ 0.025 g at ~0.8 g/cm³ bulk density).
- Volume: **V = 0.03 × 2^t cm³**. Each milestone is the **first whole second** where V passes the reference.
- The on-screen clock shows **simulated** seconds; it runs faster than real time after the first beats (labelled as a time-lapse).

## Milestones (all checked in Python, `2^t × 0.03 cm³`)

| t (s) | N = 2^t | Rice volume | Reference | Ratio | Line on screen |
|---:|---:|---:|---|---:|---|
| 0 | 1 | 0.03 cm³ | one grain | 1 | one grain of rice |
| 10 | 1,024 | 31 cm³ | a handful ≈ 30 mL | 1.02 | ≈ a handful |
| 14 | 16,384 | 0.49 L | cereal bowl ≈ 0.5 L | 0.98 | ≈ a full bowl |
| 19 | 524,288 | 15.7 L | bucket ≈ 10–15 L | 1.3 | ≈ a bucket (not narrated) |
| 23 | 8,388,608 | 252 L | bathtub ≈ 250 L | 1.01 | ≈ a full bathtub |
| 30 | 1,073,741,824 | 32 m³ | kitchen 4 × 3 × 2.5 m = 30 m³ | 1.07 | your whole kitchen |
| 34 | 17,179,869,184 | 515 m³ | house ≈ 200 m² × 2.5 m = 500 m³ | 1.03 | a whole house |
| 37 | 137,438,953,472 | 4,123 m³ | Olympic pool 50 × 25 × 2 m = 2,500 m³ (t=36 is 2,062: too small) | 1.65 | an Olympic pool |
| 47 | 1.41 × 10¹⁴ | 4.2 million m³ | Great Pyramid ≈ 2.6 million m³ (t=46 is 2.1 M: too small) | 1.62 | more than the Great Pyramid |
| 58 | 2.88 × 10¹⁷ | 8.6 billion m³ | Manhattan land 59.1 km² → depth 146 m ≈ 40+ stories (3.3 m each) | — | Manhattan, 40 stories deep |
| 74 | 1.89 × 10²² | 5.7 × 10¹⁴ m³ | Earth's surface 5.1 × 10¹⁴ m² → 1.1 m deep | 1.11 | the whole planet, 1 m deep |
| 95 | 3.96 × 10²⁸ | 1.19 × 10²¹ m³ | Earth's volume 1.083 × 10²¹ m³ (t=94 is 0.55×) | 1.10 | bigger than Earth |
| 106 | 8.1 × 10³¹ | 2.4 × 10²⁴ m³ | Jupiter 1.43 × 10²⁴ m³ (not narrated) | 1.70 | bigger than Jupiter |
| 116 | 8.31 × 10³⁴ | 2.49 × 10²⁷ m³ | Sun 1.41 × 10²⁷ m³ (t=115 is 0.88×) | 1.77 | bigger than the Sun |
| 120 | 1.33 × 10³⁶ | 4.0 × 10²⁸ m³ | — | 28 Suns | ≈ 28 Suns (end of film) |

2^116 exactly = 83,076,749,736,557,242,056,487,941,267,521,536.

## Beats (video time from the word timings in `audio/timeline.json`)

The counter's sim-time hits each milestone on the first word of its line. Each zoom-out runs 0.75 s before that word to 0.1 s after it (`power2.inOut`), with a whoosh peaking on the word.

| # | Video time | Sim t | Stage / camera | Narration |
|---|---|---|---|---|
| 0 | 0.00–5.98 | 0 → 10 | Grain, big and centred; hook title on frame 0; grains start piling up | One grain of rice. It doubles every second. How long until it's bigger than the Sun? |
| 1 | 5.98 | 10 | Grain stage: a handful pile | Ten seconds: a thousand grains. A handful. |
| 2 | 9.63 | 14 | zoom-out → bowl | Fourteen: a full bowl. |
| 3 | 11.74 | 23 | zoom-out → bathtub | Twenty-three: enough to fill a bathtub. |
| 4 | 14.60 | 30 | zoom-out → kitchen (cross-section) | Thirty seconds: your kitchen, packed to the ceiling. |
| 5 | 18.16 | 34 | zoom-out → house | Thirty-four: the whole house. |
| 6 | 20.39 | 37 | zoom-out → Olympic pool | Thirty-seven: an Olympic swimming pool. |
| 7 | 23.31 | 47 | zoom-out → Great Pyramid | Forty-seven: more rice than the Great Pyramid. |
| 8 | 26.43 | 58 | zoom-out → Manhattan skyline, rice at 146 m | Fifty-eight: Manhattan, buried forty stories deep. |
| 9 | 30.29 | 74 | zoom-out → Earth with a rice coat | Seventy-four: the entire planet, under a meter of rice. |
| 10 | 34.65 | 95 | continuous space zoom: rice ball passes Earth | Ninety-five: the pile is bigger than Earth itself. |
| 11 | 38.26–41.12 | 95 → 116 | ball passes Jupiter (106); the Sun's rim closes in; riser | And at one hundred and sixteen seconds... |
| 12 | 41.12 | 116 | the Sun fits inside the rice ball; bass hit | it's bigger than the Sun. |
| 13 | 42.95–49.34 | 116 → 120 | counter keeps climbing; ≈ 28 Suns | Under two minutes. That's the power of doubling. What should we double next? |

## Sound

Voice at full level. Bundled HyperFrames SFX (no licence credit needed): whoosh / whoosh-short alternating on each zoom-out at ~0.3, riser peaking at 41.15 s, bass impact on the Sun. No music bed (the free music catalog needs a HeyGen sign-in).

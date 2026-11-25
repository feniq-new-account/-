# $1 million now, or a penny that doubles every day for 30 days?

YouTube Short · 1080×1920 · 30 fps · 49.1 s · English · voice: edge-tts `en-US-AndrewMultilingualNeural` (+0%)
Episode 4 of `styles/what-if-doubling/recipe.md` (money variant: bar chart against a fixed offer).

## The model

- Your balance on day **d** = **1¢ × 2^(d−1)** (day 1 = 1 cent; it doubles every day after that). Exact: 2^(d−1) cents.
- Compared with taking **$1,000,000** on day 1. The penny passes the million on **day 28** (day 27 is still 67%).
- "Half of it came on the very last day": day 30 = $5,368,709.12, day 29 = $2,684,354.56, so exactly half the final balance was added on day 30.
- 30 days, not 31 (a 31-day month would give $10.7 million; not used).

## Milestones (checked in Python)

| Day | Balance | % of $1M | Reference line | On screen |
|---:|---:|---:|---|---|
| 1 | $0.01 | ~0% | | Just one cent |
| 7 | $0.64 | ~0% | | Not even a dollar |
| 10 | $5.12 | 0.0005% | coffee $5 | ≈ a coffee |
| 14 | $81.92 | 0.008% | | The million looks smart |
| 18 | $1,310.72 | 0.13% | new phone $1,000 | ≈ a new phone |
| 20 | $5,242.88 | 0.52% | | Still way behind |
| 23 | $41,943.04 | 4.2% | new car $30,000 | ≈ a new car |
| 24 | $83,886.08 | 8.4% | | |
| 27 | $671,088.64 | 67% | the $1M offer | Still behind |
| 28 | $1,342,177.28 | 134% | | You passed the million! |
| 29 | $2,684,354.56 | 268% | | ≈ 2.7× the million |
| 30 | $5,368,709.12 | 537% | | ≈ 5.4× the million |

Spoken amounts are rounded the normal way: $81.92 → "eighty-two dollars", $83,886 → "eighty-four thousand", $671,089 → "six hundred seventy-one thousand", $1.342M → "one point three four million", $2.684M → "two point six eight million", $5.369M → "five point three seven million".

## Beats (word timings from `audio/timeline.json`)

The clock reaches each narrated day on the word "Day". The counter then rolls from the day before up to that day's balance, landing on the spoken amount. It holds while the line finishes; the days in between pass quickly in the gap.

| Day | "Day" word | Amount word | Camera (px per $) | Narration |
|---|---|---|---|---|
| hook | 0–6.9 | | penny vs $1M stack | Would you take one million dollars right now, or one penny that doubles every day for thirty days? |
| 1 | 6.92 | 7.60 | 315 / $0.64 | Day one: one cent. |
| 7 | 8.64 | 9.62 | | Day seven: sixty-four cents. Not even a dollar. |
| 14 | 12.45 | 13.77 | 315 / $81.92 | Day fourteen: eighty-two dollars. The million is looking smart. |
| 20 | 17.44 | 18.50 | 315 / $5,243 | Day twenty: about five thousand. |
| 24 | 20.08 | 21.40 | 315 / $83,886 | Day twenty-four: eighty-four thousand. |
| 27 | 23.02 | 24.20 | 315 / $1,000,000 | Day twenty-seven: six hundred seventy-one thousand. Still behind. |
| 28 | 27.91 | 28.91 | 315 / $1.34M | Day twenty-eight: one point three four million. You just passed it. |
| 29 | 32.47 | 33.70 | 315 / $2.68M | Day twenty-nine: two point six eight million. |
| 30 | 36.47 | 37.97 | 315 / $5.37M | And on day thirty... five point three seven million dollars. (riser, bass hit) |
| outro | 41.35–49.1 | | day-30 bar split in half: "+$2.68M on day 30" / "days 1–29" | Half of it came on the very last day. That's the power of doubling. What should we double next? |

## Sound

Voice (loudnorm −14.5 LUFS, clip volume 0.8). Bundled SFX: pops on the first three amounts, whooshes on the camera pull-backs, a riser peaking on "five point three seven million", and a bass hit. No music.

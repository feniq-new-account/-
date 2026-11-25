#!/usr/bin/env python3
"""Generates index.html for 'What if a grain of rice doubled every second?' (1080x1920, HyperFrames).
All visuals drawn in code. Deterministic: grain scatter uses a seeded RNG at build time."""
import json, random, math

TL = json.load(open('timeline.json'))
TOTAL = TL['total']
LN = {l['id']: l for l in TL['lines']}
rng = random.Random(7)

def st(i, lead=0.25):
    return round(LN[i]['start'] - lead, 3)

# stage id, start, sim-second target, tag text
STAGES = [
    ('grain', 0.0, None, '×2 EVERY SECOND'),
    ('hand', st('l3'), 10, 'A HANDFUL'),
    ('bowl', st('l4'), 14, 'A FULL BOWL'),
    ('tub', st('l5'), 23, 'A BATHTUB'),
    ('house', st('l6'), 34, 'A WHOLE HOUSE'),
    ('pyr', st('l7'), 47, 'THE GREAT PYRAMID'),
    ('harv', st('l8'), 55, "THE WORLD'S HARVEST"),
    ('earth', st('l9'), 95, 'PLANET EARTH'),
    ('sun', st('l10'), 116, 'THE SUN'),
    ('univ', st('l11'), 293, 'THE UNIVERSE'),
    ('out', st('l12', 0.3), None, ''),
]
ends = [s[1] for s in STAGES[1:]] + [TOTAL]

RICE = 'url(#rice)'

def grain(x, y, rx=12, ry=5, rot=0, fill='#fbf5e3', stroke='#cdbb8f', sw=1.5):
    return (f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="{rx}" ry="{ry}" transform="rotate({rot:.0f} {x:.1f} {y:.1f})" '
            f'fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>')

def pattern():
    g = ''.join(grain(rng.uniform(0, 56), rng.uniform(0, 56), 7, 3, rng.uniform(0, 180), sw=1) for _ in range(16))
    return (f'<svg width="0" height="0" style="position:absolute"><defs>'
            f'<pattern id="rice" width="56" height="56" patternUnits="userSpaceOnUse"><rect width="56" height="56" fill="#e6dab9"/>{g}</pattern>'
            f'<radialGradient id="sunG"><stop offset="0" stop-color="#fff6c2"/><stop offset=".55" stop-color="#ffc23d"/><stop offset="1" stop-color="#ff7a1a"/></radialGradient>'
            f'<radialGradient id="glow"><stop offset="0" stop-color="#ffb347" stop-opacity=".55"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>'
            f'<radialGradient id="gal"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".4" stop-color="#9fb4ff" stop-opacity=".45"/><stop offset="1" stop-color="#6c5cff" stop-opacity="0"/></radialGradient>'
            f'</defs></svg>')

def mound(x0, x1, base, peak):
    xm = (x0 + x1) / 2
    return f'<path d="M{x0} {base} Q{xm} {2*peak-base} {x1} {base} Z" fill="{RICE}" stroke="#cdbb8f" stroke-width="3"/>'

GROUND = '<line x1="40" y1="760" x2="860" y2="760" stroke="#3a4560" stroke-width="4" stroke-linecap="round"/>'

def svg_grain():
    # 8x8 grid; group k holds grains [2^(k-1), 2^k)
    groups = []
    idx = 0
    for k in range(7):
        n = 1 if k == 0 else 2 ** (k - 1)
        items = []
        for _ in range(n):
            r, c = divmod(idx, 8)
            x, y = 205 + c * 70, 205 + r * 70
            items.append(grain(x, y, 22, 9, -30 + (idx * 37) % 60, sw=2))
            idx += 1
        groups.append(f'<g id="gg{k}" opacity="0">{"".join(items)}</g>')
    big = f'<g id="bigGrain">{grain(450, 450, 150, 62, -25, sw=6)}</g>'
    sun = ('<g id="hookSun" opacity="0"><circle cx="760" cy="120" r="110" fill="url(#glow)"/>'
           '<circle cx="760" cy="120" r="52" fill="url(#sunG)"/></g>')
    return big + ''.join(groups) + sun

def svg_hand():
    return GROUND + mound(300, 600, 760, 610) + ''.join(
        grain(rng.uniform(320, 580), rng.uniform(745, 770), 9, 4, rng.uniform(0, 180)) for _ in range(14))

def svg_bowl():
    return (GROUND + '<ellipse cx="450" cy="745" rx="150" ry="18" fill="#1d2b45"/>'
            '<path d="M170 520 Q170 760 450 760 Q730 760 730 520 Z" fill="#2f5e9e" stroke="#9cc0f0" stroke-width="5"/>'
            '<path d="M220 600 Q450 640 680 600" stroke="#9cc0f0" stroke-width="4" fill="none" opacity=".5"/>'
            + mound(180, 720, 522, 300) +
            '<ellipse cx="450" cy="522" rx="282" ry="22" fill="none" stroke="#9cc0f0" stroke-width="6"/>')

def svg_tub():
    return (GROUND + '<circle cx="210" cy="740" r="18" fill="#c9d3de"/><circle cx="690" cy="740" r="18" fill="#c9d3de"/>'
            '<rect x="110" y="470" width="680" height="260" rx="90" fill="#e8eef5" stroke="#ffffff" stroke-width="6"/>'
            '<path d="M760 470 L760 330 Q760 300 730 300 L680 300" stroke="#c9d3de" stroke-width="16" fill="none" stroke-linecap="round"/>'
            + mound(120, 780, 478, 330) +
            '<rect x="100" y="462" width="700" height="26" rx="13" fill="#ffffff"/>')

def svg_house():
    return (GROUND + '<polygon points="150,450 450,170 750,450" fill="#e6dab9" />'
            '<polygon points="150,450 450,170 750,450" fill="url(#rice)" stroke="#ffffff" stroke-width="8" stroke-linejoin="round"/>'
            '<rect x="200" y="440" width="500" height="320" fill="url(#rice)" stroke="#ffffff" stroke-width="8"/>'
            '<rect x="250" y="500" width="110" height="100" fill="none" stroke="#ffffff" stroke-width="6"/>'
            '<rect x="540" y="500" width="110" height="100" fill="none" stroke="#ffffff" stroke-width="6"/>'
            '<rect x="400" y="600" width="100" height="160" fill="none" stroke="#ffffff" stroke-width="6"/>'
            + mound(360, 560, 760, 700) + mound(640, 860, 760, 690))

def svg_pyr():
    sand = '<rect x="40" y="760" width="820" height="40" rx="10" fill="#7a5b2e"/>'
    return (sand + '<polygon points="90,760 450,300 810,760" fill="url(#rice)" stroke="#f3e2b0" stroke-width="6" stroke-linejoin="round"/>'
            '<polyline points="450,300 520,760" stroke="#cdbb8f" stroke-width="4" opacity=".7" fill="none"/>'
            '<g fill="#1a2238"><circle cx="830" cy="735" r="4"/><rect x="827" y="740" width="6" height="18" rx="2"/></g>'
            '<text x="815" y="690" fill="#9aa6c4" font-family="Inter" font-weight="700" font-size="54" text-anchor="middle">you</text>')

def svg_harv():
    sacks = ''
    for r in range(5):
        for c in range(5):
            x, y = 150 + c * 44, 712 - r * 52
            sacks += f'<rect x="{x}" y="{y}" width="38" height="46" rx="12" fill="#8a6b3d" stroke="#c49a5a" stroke-width="2"/>'
    return (GROUND + sacks +
            '<rect x="470" y="300" width="250" height="460" rx="14" fill="url(#rice)" stroke="#f3e2b0" stroke-width="5"/>'
            '<text x="260" y="404" fill="#c9d2ea" font-family="Inter" font-weight="700" font-size="58" text-anchor="middle">World harvest</text>'
            '<text x="260" y="460" fill="#ffb347" font-family="Inter" font-weight="900" font-size="60" text-anchor="middle">520M tonnes</text>'
            '<text x="595" y="230" fill="#c9d2ea" font-family="Inter" font-weight="700" font-size="58" text-anchor="middle">Your rice</text>'
            '<text x="595" y="288" fill="#ffb347" font-family="Inter" font-weight="900" font-size="60" text-anchor="middle">~900M tonnes</text>')

def svg_earth():
    land = ('<path d="M300 300 q60 -40 120 0 q30 60 -20 90 q-60 30 -90 -10 q-30 -40 -10 -80z" fill="#3f9a55"/>'
            '<path d="M470 420 q80 -30 130 20 q20 80 -40 120 q-70 20 -90 -40 q-20 -60 0 -100z" fill="#3f9a55"/>'
            '<path d="M260 520 q50 -20 80 30 q0 60 -50 70 q-50 -10 -30 -100z" fill="#3f9a55"/>')
    return ('<circle cx="450" cy="450" r="330" fill="url(#glow)" opacity=".5"/>'
            '<circle cx="450" cy="450" r="290" fill="#1f5fa8"/>' + land +
            '<circle id="earthRice" cx="450" cy="450" r="300" fill="url(#rice)" stroke="#f3e2b0" stroke-width="6"/>')

def svg_sun():
    return ('<circle cx="450" cy="450" r="430" fill="url(#glow)"/>'
            '<circle cx="450" cy="450" r="320" fill="url(#sunG)"/>'
            '<circle id="sunRice" cx="450" cy="450" r="330" fill="url(#rice)" stroke="#f3e2b0" stroke-width="6"/>'
            '<circle cx="840" cy="830" r="3" fill="#4da3ff"/>'
            '<text x="828" y="815" fill="#9aa6c4" font-family="Inter" font-weight="700" font-size="54" text-anchor="end">Earth</text>')

def svg_univ():
    pts = []
    while len(pts) < 260:
        x, y = rng.uniform(40, 860), rng.uniform(40, 860)
        if (x-450)**2 + (y-450)**2 < 400**2: pts.append((x, y))
    s = '<circle cx="450" cy="450" r="420" fill="#050816" stroke="#2a3557" stroke-width="4"/>' + ''.join(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{rng.choice([1.5,2,2,3,3.5])}" fill="#ffffff" opacity="{rng.uniform(.4,1):.2f}"/>' for x, y in pts)
    gal = ''.join(f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{rx*.38:.0f}" transform="rotate({r} {x} {y})" fill="url(#gal)"/>'
                  for x, y, rx, r in [(250, 260, 120, -20), (640, 520, 160, 25), (330, 700, 90, 50)])
    return s + gal + '<circle id="univRice" cx="450" cy="450" r="424" fill="url(#rice)" stroke="#f3e2b0" stroke-width="6"/>'

SVG = dict(grain=svg_grain, hand=svg_hand, bowl=svg_bowl, tub=svg_tub, house=svg_house, pyr=svg_pyr,
           harv=svg_harv, earth=svg_earth, sun=svg_sun, univ=svg_univ)

stage_html = []
for (sid, s0, _, tag), e in zip(STAGES, ends):
    d = round(e - s0, 3)
    if sid == 'out':
        inner = ('<div class="outro"><div class="o1">THE POWER OF</div><div class="o2">DOUBLING</div>'
                 '<div class="o3">2<sup>n</sup></div><div class="o4">Follow for more</div></div>')
    else:
        inner = (f'<svg class="art" viewBox="0 0 900 900" width="520" height="520">{SVG[sid]()}</svg>'
                 f'<div class="tag" id="tag-{sid}">{tag}</div>')
    stage_html.append(f'<div id="st-{sid}" class="clip stage" data-start="{s0}" data-duration="{d}" data-track-index="1">'
                      f'<div class="cam" id="cam-{sid}">{inner}</div></div>')

cap_html = []
for l in TL['lines']:
    s0 = l['start']; d = round(l['end'] - s0 + 0.3, 3)
    words = ''.join(f'<span class="w">{w}</span> ' for w in l['text'].split())
    cap_html.append(f'<div id="cap-{l["id"]}" class="clip capwrap" data-start="{s0}" data-duration="{d}" data-track-index="3">'
                    f'<div class="cap" id="capi-{l["id"]}">{words}</div></div>')

# sim-second keyframes: (video t, sim s)
KF = [(0, 0), (0.75, 0), (3.5, 6), (6.6, 6)]
prev = 6
for sid, s0, tgt, _ in STAGES[1:-1]:
    KF += [(s0, prev), (s0 + 0.8, tgt)]
    prev = tgt

js_data = json.dumps(dict(
    total=TOTAL, kf=KF,
    stages=[dict(id=s[0], s=s[1], e=e) for s, e in zip(STAGES, ends)],
    lines=TL['lines']))

html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1080, height=1920" />
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<style>
:root {{ --ground:#070b16; --ink:#f4efe2; --gold:#ffb347; --mute:#8d99b8; }}
* {{ margin:0; padding:0; box-sizing:border-box; }}
html, body {{ margin:0; width:1080px; height:1920px; overflow:hidden; background:var(--ground); }}
#root {{ position:relative; width:1080px; height:1920px; overflow:hidden; font-family:Inter, sans-serif; color:var(--ink);
  background: radial-gradient(1200px 900px at 50% 45%, #13203d 0%, #070b16 70%); }}
#space {{ position:absolute; inset:0; background:#02030a; opacity:0; }}
#floor {{ position:absolute; left:0; top:1290px; width:1080px; height:630px; overflow:hidden; }}
#counter {{ position:absolute; left:120px; width:768px; top:296px; height:236px; text-align:center; }}
#csec {{ font-family:'Space Mono', monospace; font-size:34px; letter-spacing:.18em; color:var(--gold); }}
#cnum {{ font-family:'Archivo Black', sans-serif; line-height:1.05; margin-top:10px; color:#ffffff; white-space:nowrap; }}
#cunit {{ font-family:Inter, sans-serif; font-weight:700; font-size:32px; color:var(--mute); margin-top:8px; letter-spacing:.02em; }}
.stage {{ position:absolute; left:120px; top:0; width:768px; height:1920px; }}
.cam {{ position:absolute; inset:0; transform-origin:330px 860px; }}
.art {{ position:absolute; left:70px; top:600px; }}
.tag {{ position:absolute; left:0; width:768px; top:536px; text-align:center; font-family:Oswald, sans-serif; font-weight:700;
  font-size:54px; line-height:1; letter-spacing:.05em; color:var(--gold); }}
.capwrap {{ position:absolute; left:120px; width:660px; top:1134px; height:114px; }}
.cap {{ text-align:center; font-family:Inter, sans-serif; font-weight:700; font-size:36px; line-height:1.22; color:#ffffff; }}
.cap .w {{ opacity:.28; }}
.outro {{ position:absolute; left:0; width:768px; top:300px; height:940px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; }}
.o1 {{ font-family:Oswald, sans-serif; font-size:54px; letter-spacing:.1em; color:var(--mute); }}
.o2 {{ font-family:'Archivo Black', sans-serif; font-size:100px; color:#ffffff; line-height:1; margin-top:10px; }}
.o3 {{ font-family:'Archivo Black', sans-serif; font-size:150px; color:var(--gold); line-height:1.1; margin-top:30px; }}
.o3 sup {{ font-size:74px; }}
.o4 {{ font-family:Inter, sans-serif; font-weight:700; font-size:40px; color:#ffffff; margin-top:30px; padding:16px 40px;
  border:4px solid var(--gold); border-radius:60px; }}
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="1080" data-height="1920">
{pattern()}
<div id="space"></div><svg id="floor" width="1080" height="630" viewBox="0 0 1080 630"><g id="floorG"><path d="M0 40 Q60 0 120 40 Q180 70 240 40 Q300 0 360 40 Q420 70 480 40 Q540 0 600 40 Q660 70 720 40 Q780 0 840 40 Q900 70 960 40 Q1020 0 1080 40 L1080 700 L0 700 Z" fill="url(#rice)" stroke="#f3e2b0" stroke-width="4"/></g></svg>
<div id="counter" class="clip" data-start="0" data-duration="{STAGES[-1][1]}" data-track-index="2">
  <div id="cin"><div id="csec">SECOND 0</div><div id="cnum">1</div><div id="cunit">grain of rice</div></div>
</div>
{''.join(stage_html)}
{''.join(cap_html)}
<audio id="mix" src="assets/mix.wav" data-start="0" data-duration="{TOTAL}" data-track-index="4"></audio>
</div>
<script>
const D = {js_data};
const tl = gsap.timeline({{ paused: true }});
const SUP = {{'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'}};
function simAt(t) {{
  const k = D.kf; if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (t <= k[i][0]) {{
    const a = k[i-1], b = k[i]; if (b[0] === a[0]) return b[1];
    const u = (t - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * u; }}
  return k[k.length-1][1];
}}
function fmt(s) {{
  if (s < 20) return [Math.pow(2, s).toLocaleString('en-US'), s === 0 ? 'grain of rice' : 'grains of rice'];
  const names = [[1e18,'quintillion'],[1e15,'quadrillion'],[1e12,'trillion'],[1e9,'billion'],[1e6,'million']];
  if (s < 60) {{ const v = Math.pow(2, s);
    for (const [d, n] of names) if (v >= d) {{ const m = v / d; return [m >= 100 ? m.toFixed(0) : m.toFixed(1), n + ' grains']; }} }}
  const e = Math.floor(s * Math.log10(2)), m = Math.pow(10, s * Math.log10(2) - e);
  return [m.toFixed(2) + '×10' + String(e).split('').map(c => SUP[c]).join(''), 'grains of rice'];
}}
const cs = document.getElementById('csec'), cn = document.getElementById('cnum'), cu = document.getElementById('cunit');
let last = -1;
function draw(t) {{
  const s = Math.floor(simAt(t) + 1e-6); if (s === last) return; last = s;
  const [num, unit] = fmt(s);
  cs.textContent = 'SECOND ' + s; cn.textContent = num; cu.textContent = unit;
  cn.style.fontSize = Math.min(118, 740 / (num.length * 0.74)) + 'px';
}}
draw(0);
tl.to({{}}, {{ duration: D.total, ease: 'none', onUpdate: () => draw(tl.time()) }}, 0);

// rising rice floor (texture below the safe band): climbs a step at every stage
tl.set('#floorG', {{ y: 640 }}, 0);
[[0.8, 600], [3.5, 560]].concat(D.stages.slice(1, -1).map((st, i) => [st.s + 0.2, 520 - i * 50])).forEach(([t, y]) => {{
  tl.to('#floorG', {{ y: y, duration: 0.7, ease: 'power2.out' }}, t);
}});
tl.to('#floorG', {{ y: 640, duration: 0.8, ease: 'power2.in' }}, D.stages[D.stages.length - 1].s);

// counter pulse on each stage landing
D.stages.slice(1, -1).forEach(st => {{
  tl.fromTo('#cin', {{ scale: 1 }}, {{ scale: 1.08, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.out', immediateRender: false }}, st.s + 0.8);
}});

// stages: zoom in from close, slow drift out, zoom out on exit
D.stages.forEach(st => {{
  const cam = '#cam-' + st.id, d = st.e - st.s;
  if (st.id !== 'grain') tl.fromTo(cam, {{ scale: 1.7, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: 0.55, ease: 'power3.out' }}, st.s);
  tl.to(cam, {{ scale: 0.9, duration: Math.max(0.1, d - 1.05), ease: 'none' }}, st.s + 0.55);
  if (st.id !== 'out') tl.to(cam, {{ scale: 0.3, opacity: 0, duration: 0.45, ease: 'power2.in' }}, st.e - 0.47);
}});

// hook: big grain, then doubling grid
tl.to('#bigGrain', {{ scale: 0.15, opacity: 0, transformOrigin: '50% 50%', duration: 0.35, ease: 'power2.in' }}, 0.6);
for (let k = 0; k < 7; k++) tl.to('#gg' + k, {{ opacity: 1, duration: 0.12 }}, 0.75 + k * (2.75 / 6));
tl.to('#hookSun', {{ opacity: 1, duration: 0.5 }}, {LN['l2']['start']});

// engulf moments
tl.fromTo('#earthRice', {{ scale: 0 }}, {{ scale: 1, transformOrigin: '50% 50%', duration: 1.5, ease: 'power2.inOut', immediateRender: false }}, {STAGES[7][1]} + 1.5);
tl.fromTo('#sunRice', {{ scale: 0 }}, {{ scale: 1, transformOrigin: '50% 50%', duration: 1.4, ease: 'power2.inOut', immediateRender: false }}, {STAGES[8][1]} + 1.0);
tl.set(['#earthRice', '#sunRice', '#univRice'], {{ scale: 0, transformOrigin: '50% 50%' }}, 0);
tl.fromTo('#univRice', {{ scale: 0 }}, {{ scale: 1, transformOrigin: '50% 50%', duration: 2.0, ease: 'power2.in', immediateRender: false }}, {STAGES[9][1]} + 1.3);
tl.to('#space', {{ opacity: 1, duration: 1.0 }}, {STAGES[7][1]});
tl.to('#space', {{ opacity: 0, duration: 0.6 }}, {STAGES[10][1]});

// captions: words brighten as spoken (spread by character count)
D.lines.forEach(l => {{
  const ws = document.querySelectorAll('#capi-' + l.id + ' .w');
  const lens = [...ws].map(w => w.textContent.length + 1), tot = lens.reduce((a, b) => a + b, 0);
  let acc = 0;
  tl.fromTo('#capi-' + l.id, {{ y: 30, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.2, ease: 'power2.out' }}, l.start);
  ws.forEach((w, i) => {{ tl.to(w, {{ opacity: 1, duration: 0.08 }}, l.start + (l.end - l.start) * acc / tot); acc += lens[i]; }});
  tl.to('#capi-' + l.id, {{ opacity: 0, duration: 0.15 }}, l.end + 0.13);
}});

// outro
tl.from('#st-out .o1', {{ y: 40, opacity: 0, duration: 0.4 }}, {STAGES[10][1]} + 0.3);
tl.from('#st-out .o2', {{ y: 40, opacity: 0, duration: 0.4 }}, {STAGES[10][1]} + 0.5);
tl.from('#st-out .o3', {{ scale: 0.4, opacity: 0, duration: 0.5, ease: 'back.out(2)' }}, {STAGES[10][1]} + 0.9);
tl.from('#st-out .o4', {{ y: 40, opacity: 0, duration: 0.4 }}, {LN['l12']['start']} + 1.4);

window.__timelines = window.__timelines || {{}};
window.__timelines['main'] = tl;
tl.seek(0);
</script>
</body>
</html>
'''
open('index.html', 'w').write(html)
print('ok', TOTAL, len(html))

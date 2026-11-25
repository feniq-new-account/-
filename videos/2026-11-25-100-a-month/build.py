import json
t = json.load(open('voice/timeline.json'))
D = 27.0
# chart geometry
CX, CY, CW, CH = 120, 80, 820, 640   # inside svg 1000x780
MAXV = 1_200_000
def fv_series(start):
    b = 0; pts = []
    for age in range(start, 68):
        pts.append((age, b))
        b = (b + 1200) * 1.10
    return pts
def xy(age, v):
    return CX + (age - 20) / 47 * CW, CY + CH - v / MAXV * CH
def path(pts):
    return "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in (xy(a, v) for a, v in pts))
pa, ps = path(fv_series(20)), path(fv_series(30))
ax, ay = xy(67, fv_series(20)[-1][1]); sx, sy = xy(67, fv_series(30)[-1][1])
grid = "".join(f'<line x1="{CX}" x2="{CX+CW}" y1="{xy(20,v)[1]:.1f}" y2="{xy(20,v)[1]:.1f}" class="g"/><text x="{CX-18}" y="{xy(20,v)[1]+10:.1f}" class="gl">${v//1000 if v<1e6 else 1}{"k" if v<1e6 else "M"}</text>' for v in (250000, 500000, 750000, 1000000))
ticks = "".join(f'<text x="{xy(a,0)[0]:.1f}" y="{CY+CH+52}" class="tk">{a}</text>' for a in (20, 30, 40, 50, 60, 67))

# captions
caps = []; cjs = []
for i, l in enumerate(t['lines']):
    toks = l['text'].split()
    shown = toks if len(toks) == len(l['words']) else [w['w'] for w in l['words']]
    words = "".join(f'<span class="w" id="c{i}w{j}">{shown[j]}</span> ' for j, w in enumerate(l['words']))
    caps.append(f'<div class="cap" id="cap{i}">{words}</div>')
    end = t['lines'][i+1]['start'] - 0.05 if i + 1 < len(t['lines']) else l['end'] + 0.6
    cjs.append(f'tl.set("#cap{i}", {{opacity: 1}}, {l["start"]:.2f}); tl.set("#cap{i}", {{opacity: 0}}, {end:.2f});')
    for j, w in enumerate(l['words']):
        cjs.append(f'tl.set("#c{i}w{j}", {{color: "#FFD43B", scale: 1.08}}, {w["start"]:.2f}); tl.set("#c{i}w{j}", {{color: "#ffffff", scale: 1}}, {w["end"]:.2f});')

html = open('template.tpl').read()
html = (html.replace('%%PA%%', pa).replace('%%PS%%', ps).replace('%%GRID%%', grid).replace('%%TICKS%%', ticks)
        .replace('%%AX%%', f'{ax:.1f}').replace('%%AY%%', f'{ay:.1f}').replace('%%SX%%', f'{sx:.1f}').replace('%%SY%%', f'{sy:.1f}')
        .replace('%%CAPS%%', "\n".join(caps)).replace('%%CAPJS%%', "\n      ".join(cjs)).replace('%%D%%', str(D)))
open('index.html', 'w').write(html)
print('ok', round(ax), round(ay), round(sx), round(sy))

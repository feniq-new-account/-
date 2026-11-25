import json
t = json.load(open('voice/timeline.json'))
D = 27.5
CX, CY, CW, CH = 120, 80, 820, 640
YEARS, MAXV = 40, 1_800_000
def series(r):
    b = 0; pts = []
    for y in range(0, YEARS + 1):
        pts.append((y, b)); b = (b + 6000) * (1 + r)
    return pts
def xy(y, v): return CX + y / YEARS * CW, CY + CH - v / MAXV * CH
def path(pts): return "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in (xy(a, v) for a, v in pts))
A, B = series(0.079), series(0.07)
pa, ps = path(A), path(B)
ax, ay = xy(YEARS, A[-1][1]); sx, sy = xy(YEARS, B[-1][1])
lab = lambda v: f"${v/1e6:g}M" if v >= 1e6 else f"${v//1000}k"
grid = "".join(f'<line x1="{CX}" x2="{CX+CW}" y1="{xy(0,v)[1]:.1f}" y2="{xy(0,v)[1]:.1f}" class="g"/><text x="{CX-18}" y="{xy(0,v)[1]+10:.1f}" class="gl">{lab(v)}</text>' for v in (500000, 1000000, 1500000))
ticks = "".join(f'<text x="{xy(y,0)[0]:.1f}" y="{CY+CH+52}" class="tk">{"yr " if y==0 else ""}{y}</text>' for y in (0, 10, 20, 30, 40))
caps, cjs = [], []
groups = []
for l in t['lines']:
    toks = l['text'].split(); ws = l['words']
    shown = toks if len(toks) == len(ws) else [w['w'] for w in ws]
    cur = []
    for j, w in enumerate(ws):
        cur.append((shown[j], w))
        if len(cur) >= 6 and shown[j][-1] in '.,' and j < len(ws) - 1:
            groups.append(cur); cur = []
    groups.append(cur)
for i, g in enumerate(groups):
    caps.append(f'<div class="cap" id="cap{i}">' + "".join(f'<span class="w" id="c{i}w{j}">{s}</span> ' for j, (s, w) in enumerate(g)) + '</div>')
    st = g[0][1]['start']; end = groups[i+1][0][1]['start'] - 0.05 if i + 1 < len(groups) else g[-1][1]['end'] + 0.6
    cjs.append(f'tl.set("#cap{i}", {{opacity: 1}}, {st:.2f}); tl.set("#cap{i}", {{opacity: 0}}, {end:.2f});')
    for j, (s, w) in enumerate(g):
        cjs.append(f'tl.set("#c{i}w{j}", {{color: "#FFD43B", scale: 1.08}}, {w["start"]:.2f}); tl.set("#c{i}w{j}", {{color: "#ffffff", scale: 1}}, {w["end"]:.2f});')
html = open('template.tpl').read()
for k, v in {'%%PA%%': pa, '%%PS%%': ps, '%%GRID%%': grid, '%%TICKS%%': ticks, '%%AX%%': f'{ax:.1f}', '%%AY%%': f'{ay:.1f}',
             '%%SX%%': f'{sx:.1f}', '%%SY%%': f'{sy:.1f}', '%%CAPS%%': "\n".join(caps), '%%CAPJS%%': "\n      ".join(cjs), '%%D%%': str(D)}.items():
    html = html.replace(k, v)
open('index.html', 'w').write(html)
print('ok', round(A[-1][1]), round(B[-1][1]), len(groups))

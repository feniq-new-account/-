"""Money-math Shorts generator. python3 gen.py <episode.py>
An episode file defines EP (dict). Builds ../<slug>/ : voice, mix, index.html; then check + render via run.sh."""
import json, os, subprocess, sys, shutil, runpy

HERE = os.path.dirname(os.path.abspath(__file__))
SK = '/home/user/-/.claude/skills'
PY = f'{SK}/reverse-engineer-video/.venv/bin/python'
WRAP = '/tmp/claude-0/-home-user/cb9ec266-07fb-5e1a-8bc0-e65bf70060a2/scratchpad/tts_wrap.py'

EP = runpy.run_path(sys.argv[1])['EP']
P = os.path.join(HERE, '..', EP['slug'])
os.makedirs(f'{P}/voice', exist_ok=True); os.makedirs(f'{P}/assets', exist_ok=True)
for f in ('AGENTS.md', 'CLAUDE.md', 'hyperframes.json', 'package.json'):
    shutil.copy(f'{HERE}/../2026-11-26-one-percent-fee/{f}', P)
json.dump({'id': EP['slug'], 'name': EP['slug']}, open(f'{P}/meta.json', 'w'), indent=2)
shutil.copy(sys.argv[1], f'{P}/episode.py')

# voice + music
lines = [{'id': f's{i+1}', 'text': t, 'gap': 0.3} for i, t in enumerate(EP['lines'])]
lines[5]['gap'] = 0.4; lines[-1]['gap'] = 0.2
json.dump({'lead': 0.3, 'tail': 1.8, 'trim': True, 'lines': lines}, open(f'{P}/script.json', 'w'), ensure_ascii=False, indent=1)
if not os.path.exists(f'{P}/voice/timeline.json'):
    subprocess.run([PY, WRAP, f'{SK}/reverse-engineer-video/scripts/tts.py', 'script.json', 'voice', 'en-US-AndrewNeural'], cwd=P, check=True, capture_output=True)
sfx = {'bpm': 112, 'music_db': -21, 'events': [
    {'line': '*', 'type': 'whoosh', 'db': -17}, {'line': 's1', 'offset': 1.4, 'type': 'stamp', 'db': -13},
    {'line': 's4', 'offset': 0.3, 'type': 'pop', 'db': -12}, {'line': 's5', 'offset': 0.3, 'type': 'thud', 'db': -10},
    {'line': 's6', 'offset': 0.2, 'type': 'boom', 'db': -9}, {'line': 's7', 'offset': 0.3, 'type': 'stamp', 'db': -10},
    {'line': 's8', 'offset': 0.1, 'type': 'sting', 'db': -11}]}
json.dump(sfx, open(f'{P}/sfx.json', 'w'))
subprocess.run([PY, f'{SK}/reverse-engineer-video/scripts/score.py', 'voice/timeline.json', 'voice/voice.wav', 'sfx.json', 'assets/mix.wav'], cwd=P, check=True, capture_output=True)
for f in os.listdir(f'{P}/voice'):
    if f.startswith('line'): os.remove(f'{P}/voice/{f}')

t = json.load(open(f'{P}/voice/timeline.json'))
T = [l['start'] for l in t['lines']]; E_ = [l['end'] for l in t['lines']]
AD = round(t['duration'], 2); D = round(AD + 0.15, 2)

# chart
CX, CY, CW, CH = 120, 80, 820, 640
X0, X1, MAXV = EP['x0'], EP['x1'], EP['maxv']
def xy(x, v): return CX + (x - X0) / (X1 - X0) * CW, CY + CH - v / MAXV * CH
def path(pts): return 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in (xy(a, v) for a, v in pts))
SA, SB = EP['series_a'], EP['series_b']
ax, ay = xy(*SA[-1]); bx, by = xy(*SB[-1])
grid = ''.join(f'<line x1="{CX}" x2="{CX+CW}" y1="{xy(X0,v)[1]:.1f}" y2="{xy(X0,v)[1]:.1f}" class="g"/><text x="{CX-18}" y="{xy(X0,v)[1]+10:.1f}" class="gl">{lab}</text>' for v, lab in EP['ygrid'])
ticks = ''.join(f'<text x="{xy(x,0)[0]:.1f}" y="{CY+CH+52}" class="tk">{lab}</text>' for x, lab in EP['xticks'])

# captions (split long lines at sentence ends)
groups = []
for l in t['lines']:
    toks = l['text'].split(); ws = l['words']
    shown = toks if len(toks) == len(ws) else [w['w'] for w in ws]
    cur = []
    for j, w in enumerate(ws):
        cur.append((shown[j], w))
        if len(cur) >= 5 and shown[j][-1] in '.,?' and j < len(ws) - 1:
            groups.append(cur); cur = []
    groups.append(cur)
caps, cjs = [], []
for i, g in enumerate(groups):
    caps.append(f'<div class="cap" id="cap{i}">' + ''.join(f'<span class="w" id="c{i}w{j}">{s}</span> ' for j, (s, w) in enumerate(g)) + '</div>')
    st = g[0][1]['start']; end = groups[i+1][0][1]['start'] - 0.05 if i + 1 < len(groups) else g[-1][1]['end'] + 0.6
    cjs.append(f'tl.set("#cap{i}", {{opacity: 1}}, {st:.2f}); tl.set("#cap{i}", {{opacity: 0}}, {end:.2f});')
    for j, (s, w) in enumerate(g):
        cjs.append(f'tl.set("#c{i}w{j}", {{color: "#FFD43B", scale: 1.08}}, {w["start"]:.2f}); tl.set("#c{i}w{j}", {{color: "#ffffff", scale: 1}}, {w["end"]:.2f});')

A, B = EP['a'], EP['b']
stage = f'''<div id="stage" class="stage clip" data-start="0" data-duration="{D}" data-track-index="0" data-track-kind="graphics">
        <div class="top" id="p1"><div class="kicker">{EP['p1_kicker']}</div><div class="big num">{EP['p1_big']}</div></div>
        <div class="top" id="p3"><div class="badge">{EP['badge']}</div></div>
        <div class="top" id="p4">
          <div class="kicker">{EP['p4_kicker']}</div>
          <div class="rows">
            <div class="row"><span style="color:var(--{EP['row_first']})">{EP['rows'][0][0]}</span><span class="num">{EP['rows'][0][1]}</span></div>
            <div class="row"><span style="color:var(--{'sam' if EP['row_first']=='alex' else 'alex'})">{EP['rows'][1][0]}</span><span class="num">{EP['rows'][1][1]}</span></div>
          </div>
          <div class="plus">{EP['plus']}</div>
        </div>
        <div class="top" id="p5">
          <div class="kicker">{EP['p5_kicker']}</div>
          <div class="ctr">
            <div class="line" id="lsam"><span class="who" style="color:var(--sam)">{B['label']}</span><span class="num" id="vsam" style="color:var(--sam)">$0</span></div>
            <div class="line" id="lalex"><span class="who" style="color:var(--alex)">{A['label']}</span><span class="num" id="valex" style="color:var(--alex)">$0</span></div>
          </div>
        </div>
        <div class="people" id="people">
          <div class="person {'alex' if EP['a_first'] else 'sam'}" id="pa1"><div class="av num">{(A if EP['a_first'] else B)['initial']}</div><h2>{(A if EP['a_first'] else B)['name']}</h2><div class="age" id="agea">{(A if EP['a_first'] else B)['tag']}</div></div>
          <div class="person {'sam' if EP['a_first'] else 'alex'}" id="ps1"><div class="av num">{(B if EP['a_first'] else A)['initial']}</div><h2>{(B if EP['a_first'] else A)['name']}</h2><div class="age" id="ages">{(B if EP['a_first'] else A)['tag']}</div></div>
        </div>
        <svg class="chart" id="chart" viewBox="0 0 1000 780">
          {grid}
          <line class="ax" x1="120" x2="940" y1="720" y2="720" />
          {ticks}
          <path id="cs" class="curve" d="{path(SB)}" stroke="#FF6B6B" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" />
          <path id="ca" class="curve" d="{path(SA)}" stroke="#3DDC97" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" />
          <circle id="dots" cx="{bx:.1f}" cy="{by:.1f}" r="20" fill="#FF6B6B" />
          <circle id="dota" cx="{ax:.1f}" cy="{ay:.1f}" r="20" fill="#3DDC97" />
        </svg>
        <div class="stamp" id="stamp"><div class="k">{EP['stamp_k']}</div><div class="num" id="vgap">{EP['stamp_v']}</div></div>
        <div class="end" id="end">
          <div class="num">{EP['end']}</div>
          <div class="follow">Follow for more money math</div>
          <div class="disc">Illustration only, not financial advice. {EP['disc']}</div>
        </div>
      </div>

      '''
r = lambda x: f'{x:.2f}'
draw_a, draw_b = EP.get('draw', (1.0, 1.0))
js = f'''    <script>
      const tl = gsap.timeline({{ paused: true }});
      const E = "power3.out", IN = "power2.in";
      const money = (el, to, at, dur, suf) => {{
        const o = {{ v: 0 }};
        tl.to(o, {{ v: to, duration: dur, ease: "power2.out", onUpdate: () => {{ document.querySelector(el).textContent = "$" + Math.round(o.v).toLocaleString("en-US") + (suf || ""); }} }}, at);
      }};
      gsap.set(["#p3", "#p4", "#p5", "#stamp", "#end", "#chart"], {{ opacity: 0 }});
      // s1
      tl.from("#p1 .big", {{ scale: 0.6, duration: 0.6, ease: "back.out(1.7)" }}, 0);
      tl.to("#p1 .big", {{ color: "#FFD43B", scale: 1.1, duration: 0.25, ease: "power4.in" }}, {r(T[0]+1.1)});
      tl.to("#p1", {{ opacity: 0, y: -40, duration: 0.3, ease: IN }}, {r(T[1]-0.3)});
      // s2 people
      tl.fromTo("#pa1", {{ y: 120, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.5, ease: E }}, {r(T[1])});
      tl.fromTo("#ps1", {{ y: 120, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.5, ease: E }}, {r(T[1]+0.45)});
      tl.fromTo(["#agea", "#ages"], {{ opacity: 0, scale: 0.6 }}, {{ opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2)", stagger: 0.3 }}, {r(T[1]+1.1)});
      tl.to("#people", {{ opacity: 0, y: -40, duration: 0.3, ease: IN }}, {r(T[2]-0.3)});
      // s3 chart
      tl.to("#p3", {{ opacity: 1, duration: 0.35 }}, {r(T[2])});
      tl.to("#chart", {{ opacity: 1, duration: 0.35 }}, {r(T[2])});
      tl.to("#ca", {{ attr: {{ "stroke-dashoffset": 0 }}, duration: {r((T[4]-T[2]-0.4)*draw_a)}, ease: "power1.in" }}, {r(T[2]+0.2)});
      tl.to("#cs", {{ attr: {{ "stroke-dashoffset": 0 }}, duration: {r((T[4]-T[2]-0.4)*draw_b)}, ease: "power1.in" }}, {r(T[2]+0.2)});
      tl.from("#dota", {{ attr: {{ r: 0 }}, duration: 0.3, ease: "back.out(3)" }}, {r(T[2]+0.2+(T[4]-T[2]-0.4)*draw_a)});
      tl.from("#dots", {{ attr: {{ r: 0 }}, duration: 0.3, ease: "back.out(3)" }}, {r(T[2]+0.2+(T[4]-T[2]-0.4)*draw_b)});
      // s4 difference
      tl.to("#p3", {{ opacity: 0, duration: 0.25 }}, {r(T[3]-0.1)});
      tl.to("#p4", {{ opacity: 1, duration: 0.35 }}, {r(T[3])});
      tl.from("#p4 .row", {{ x: 80, opacity: 0, duration: 0.35, stagger: {r(max(0.3,(E_[3]-T[3])/2.2))}, ease: E }}, {r(T[3])});
      tl.from("#p4 .plus", {{ scale: 0.6, opacity: 0, duration: 0.35, ease: "back.out(2)" }}, {r(E_[3]-0.5)});
      // s5/s6 counters
      tl.to("#p4", {{ opacity: 0, duration: 0.25 }}, {r(T[4]-0.12)});
      tl.to("#p5", {{ opacity: 1, duration: 0.3 }}, {r(T[4])});
      gsap.set("#lalex", {{ opacity: 0 }});
      money("#vsam", {B['value']}, {r(T[4]+0.5)}, {r(max(1.0,E_[4]-T[4]-0.7))}, "{B.get('suffix','')}");
      tl.to("#dots", {{ attr: {{ r: 30 }}, duration: 0.3, yoyo: true, repeat: 1 }}, {r(E_[4]-0.4)});
      tl.to("#lalex", {{ opacity: 1, duration: 0.25 }}, {r(T[5])});
      money("#valex", {A['value']}, {r(T[5]+0.2)}, {r(max(1.0,E_[5]-T[5]-0.3))}, "{A.get('suffix','')}");
      tl.to("#dota", {{ attr: {{ r: 34 }}, duration: 0.3, yoyo: true, repeat: 1 }}, {r(E_[5]-0.2)});
      tl.to("#valex", {{ scale: 1.08, transformOrigin: "100% 50%", duration: 0.25, yoyo: true, repeat: 1 }}, {r(E_[5]-0.1)});
      // s7 stamp
      tl.to("#chart", {{ opacity: 0, duration: 0.3 }}, {r(T[6])});
      tl.fromTo("#stamp", {{ opacity: 0, scale: 1.6, rotation: -6 }}, {{ opacity: 1, scale: 1, rotation: -3, duration: 0.35, ease: "power4.in" }}, {r(T[6]+0.25)});
      tl.to("#stamp", {{ scale: 1.05, duration: 0.25, yoyo: true, repeat: 1 }}, {r(E_[6]-0.6)});
      // s8 end
      tl.to(["#stamp", "#p5"], {{ opacity: 0, duration: 0.3, ease: IN }}, {r(T[7]-0.3)});
      tl.to("#end", {{ opacity: 1, duration: 0.2 }}, {r(T[7])});
      tl.from("#end .num", {{ scale: 0.7, duration: 0.6, ease: "back.out(1.7)" }}, {r(T[7])});
      tl.from("#end .disc", {{ opacity: 0, duration: 0.4 }}, {r(T[7]+0.2)});
      tl.from("#end .follow", {{ y: 40, opacity: 0, duration: 0.45, ease: E }}, {r(T[7]+1.0)});
'''
head = open(f'{HERE}/tpl_head.html').read().replace('%%D%%', str(D)).replace('%%AD%%', str(AD)).replace('%%ENDSIZE%%', str(EP.get('end_size', 150)))
mid = open(f'{HERE}/tpl_mid.html').read()
mid = mid[:mid.index('    <script>')].replace('%%D%%', str(D)).replace('%%CAPS%%', '\n'.join(caps))
tail = open(f'{HERE}/tpl_tail.html').read().replace('%%CAPJS%%', '\n      '.join(cjs))
open(f'{P}/index.html', 'w').write(head + stage + mid + js + tail)
open(f'{P}/script.md', 'w').write(f"# {EP['title']}\n\n" + '\n'.join(f'{i+1}. {l}' for i, l in enumerate(EP['lines'])) + f"\n\nTitle: {EP['title']}\nHashtags: {EP['tags']}\nNumbers: {EP['notes']}\n")
print(P, 'duration', D, 'groups', len(groups))

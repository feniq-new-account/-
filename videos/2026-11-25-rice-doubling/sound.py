"""Free generated bed: low drone + whoosh per stage + soft ticks during the hook. Deterministic."""
import json, wave, numpy as np
TL=json.load(open('timeline.json')); T=TL['total']; SR=44100; n=int(T*SR); t=np.arange(n)/SR
rng=np.random.default_rng(3)
# drone: A1 + E2 + A2 with slow swell, rising gently in brightness over time
dr=(np.sin(2*np.pi*55*t)+.6*np.sin(2*np.pi*82.41*t)+.35*np.sin(2*np.pi*110*t+.3*np.sin(2*np.pi*.2*t)))
dr*=.5+.5*np.clip(t/T,0,1); dr*=np.clip(t/1.5,0,1)*np.clip((T-t)/2.5,0,1)
bed=.05*dr
def whoosh(at,dur=.7,amp=.12):
    m=int(dur*SR); x=rng.standard_normal(m); x=np.convolve(x,np.ones(30)/30,'same')
    env=np.sin(np.pi*np.linspace(0,1,m))**2; i=int(at*SR); j=min(n,i+m); bed[i:j]+=amp*(x*env)[:j-i]
L={l['id']:l['start'] for l in TL['lines']}
for k in ['l3','l4','l5','l6','l7','l8','l9','l10','l11']: whoosh(L[k]-.55)
whoosh(L['l12']-.6,1.2,.16)
def tick(at,f=1200,amp=.09):
    m=int(.06*SR); i=int(at*SR); x=np.sin(2*np.pi*f*np.arange(m)/SR)*np.exp(-np.arange(m)/(SR*.012)); bed[i:i+m]+=amp*x
for k in range(7): tick(.75+k*(2.75/6), 900+k*120)
bed=np.clip(bed,-1,1)
with wave.open('assets/bed.wav','wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((bed*32767).astype('<i2').tobytes())
print('bed ok')

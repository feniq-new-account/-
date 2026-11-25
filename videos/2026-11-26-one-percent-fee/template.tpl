<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
    <style>
      :root { --bg: #0A0E17; --panel: #131A28; --ink: #FFFFFF; --mute: #8C97AB; --alex: #3DDC97; --sam: #FF6B6B; --gold: #FFD43B; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 1080px; height: 1920px; overflow: hidden; background: var(--bg); }
      #root { position: relative; width: 1080px; height: 1920px; overflow: hidden; font-family: "Inter", sans-serif; color: var(--ink);
        background: radial-gradient(1100px 900px at 50% 38%, #18223A 0%, var(--bg) 70%); }
      .stage { position: absolute; inset: 0; }
      .num { font-family: "Archivo Black", sans-serif; letter-spacing: -1px; }
      .top { position: absolute; left: 0; right: 0; top: 250px; height: 380px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; text-align: center; }
      .kicker { font-size: 44px; font-weight: 700; color: var(--mute); letter-spacing: 6px; text-transform: uppercase; }
      .big { font-size: 190px; line-height: 1; }
      .big small { font-size: 80px; color: var(--mute); }
      /* avatars */
      .people { position: absolute; left: 0; right: 0; top: 700px; display: flex; justify-content: center; gap: 60px; }
      .person { width: 380px; padding: 44px 30px; border-radius: 40px; background: var(--panel); display: flex; flex-direction: column; align-items: center; gap: 22px; border: 3px solid rgba(255,255,255,.07); }
      .av { width: 170px; height: 170px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 90px; color: var(--bg); }
      .person h2 { font-size: 64px; font-weight: 900; }
      .age { font-size: 38px; font-weight: 700; padding: 12px 24px; border-radius: 30px; white-space: nowrap; }
      .alex .av, .alex .age { background: var(--alex); color: var(--bg); }
      .sam .av, .sam .age { background: var(--sam); color: var(--bg); }
      /* badge */
      .badge { font-size: 58px; font-weight: 900; background: var(--panel); border: 3px solid rgba(255,255,255,.12); border-radius: 30px; padding: 22px 40px; }
      .badge b { color: var(--gold); }
      /* put-in rows */
      .rows { display: flex; flex-direction: column; gap: 16px; width: 820px; }
      .row { display: flex; justify-content: space-between; align-items: center; font-size: 50px; font-weight: 800; background: var(--panel); border-radius: 24px; padding: 18px 34px; }
      .row .num { font-size: 64px; }
      .plus { font-size: 46px; font-weight: 800; color: var(--gold); }
      /* counters */
      .ctr { display: flex; flex-direction: column; gap: 6px; width: 900px; }
      .ctr .line { display: flex; justify-content: space-between; align-items: baseline; }
      .ctr .who { font-size: 56px; font-weight: 900; }
      .ctr .num { font-size: 104px; }
      /* chart */
      .chart { position: absolute; left: 100px; top: 630px; width: 880px; height: 686px; }
      .chart .g { stroke: rgba(255,255,255,.08); stroke-width: 2; }
      .chart .gl { fill: var(--mute); font: 700 30px Inter, sans-serif; text-anchor: end; }
      .chart .tk { fill: var(--mute); font: 700 32px Inter, sans-serif; text-anchor: middle; }
      .chart .ax { stroke: rgba(255,255,255,.25); stroke-width: 3; }
      .curve { fill: none; stroke-width: 12; stroke-linecap: round; stroke-linejoin: round; }
      /* stamp */
      .stamp { position: absolute; left: 90px; right: 90px; top: 760px; padding: 50px 30px; border-radius: 44px; background: var(--sam); color: var(--bg); text-align: center; box-shadow: 0 40px 120px rgba(255,107,107,.35); }
      .stamp .k { font-size: 52px; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; }
      .stamp .num { font-size: 130px; line-height: 1.1; white-space: nowrap; }
      /* end */
      .end { position: absolute; left: 0; right: 0; top: 560px; display: flex; flex-direction: column; align-items: center; gap: 36px; text-align: center; }
      .end .num { font-size: 150px; line-height: 1.02; }
      .end .num span { color: var(--alex); }
      .follow { font-size: 50px; font-weight: 800; background: var(--gold); color: var(--bg); border-radius: 40px; padding: 22px 44px; }
      .disc { font-size: 30px; font-weight: 400; color: var(--mute); width: 860px; line-height: 1.45; }
      /* captions */
      .caps { position: absolute; left: 90px; right: 90px; top: 1380px; height: 160px; }
      .cap { position: absolute; inset: 0; display: flex; flex-wrap: wrap; justify-content: center; align-content: center; gap: 0 18px; font-size: 64px; font-weight: 900; text-align: center; line-height: 1.2; opacity: 0; text-shadow: 0 6px 20px rgba(0,0,0,.7); }
      .w { display: inline-block; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="%%D%%" data-width="1080" data-height="1920">
      <audio id="mix" class="clip" src="assets/mix.wav" data-start="0" data-duration="27.31" data-track-index="5"></audio>

      <div id="stage" class="stage clip" data-start="0" data-duration="%%D%%" data-track-index="0" data-track-kind="graphics">
        <!-- top panels -->
        <div class="top" id="p1"><div class="kicker">A tiny fee</div><div class="big num">1%</div></div>
        <div class="top" id="p3"><div class="badge"><b>$500</b>/mo · <b>40</b> yrs · market <b>8%</b></div></div>
        <div class="top" id="p4">
          <div class="kicker">Yearly fee</div>
          <div class="rows">
            <div class="row"><span style="color:var(--alex)">Mia · index fund</span><span class="num">0.1%</span></div>
            <div class="row"><span style="color:var(--sam)">Leo · managed</span><span class="num">1%</span></div>
          </div>
          <div class="plus">Both put in $240,000</div>
        </div>
        <div class="top" id="p5">
          <div class="kicker">After 40 years</div>
          <div class="ctr">
            <div class="line" id="lsam"><span class="who" style="color:var(--sam)">Leo</span><span class="num" id="vsam" style="color:var(--sam)">$0</span></div>
            <div class="line" id="lalex"><span class="who" style="color:var(--alex)">Mia</span><span class="num" id="valex" style="color:var(--alex)">$0</span></div>
          </div>
        </div>

        <!-- people -->
        <div class="people" id="people">
          <div class="person alex" id="pa1"><div class="av num">M</div><h2>Mia</h2><div class="age" id="agea">$500 / month</div></div>
          <div class="person sam" id="ps1"><div class="av num">L</div><h2>Leo</h2><div class="age" id="ages">$500 / month</div></div>
        </div>

        <!-- chart -->
        <svg class="chart" id="chart" viewBox="0 0 1000 780">
          %%GRID%%
          <line class="ax" x1="120" x2="940" y1="720" y2="720" />
          %%TICKS%%
          <path id="cs" class="curve" d="%%PS%%" stroke="#FF6B6B" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" />
          <path id="ca" class="curve" d="%%PA%%" stroke="#3DDC97" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" />
          <circle id="dots" cx="%%SX%%" cy="%%SY%%" r="20" fill="#FF6B6B" />
          <circle id="dota" cx="%%AX%%" cy="%%AY%%" r="20" fill="#3DDC97" />
        </svg>

        <div class="stamp" id="stamp"><div class="k">Eaten by a 1% fee</div><div class="num" id="vgap">−$351,943</div></div>

        <div class="end" id="end">
          <div class="num">CHECK<br />YOUR <span>FEES.</span></div>
          <div class="follow">Follow for more money math</div>
          <div class="disc">Illustration only, not financial advice. Assumes an 8% average yearly market return, $6,000 added each year, fees of 0.1% vs 1% a year, before taxes and inflation.</div>
        </div>
      </div>

      <div id="captions" class="caps clip" data-start="0" data-duration="%%D%%" data-track-index="1" data-track-kind="captions">
%%CAPS%%
      </div>
    </div>

    <script>
      const tl = gsap.timeline({ paused: true });
      const E = "power3.out", IN = "power2.in";
      const money = (el, to, at, dur) => {
        const o = { v: 0 };
        tl.to(o, { v: to, duration: dur, ease: "power2.out", onUpdate: () => { document.querySelector(el).textContent = "$" + Math.round(o.v).toLocaleString("en-US"); } }, at);
      };
      // hidden by default (children of clips)
      gsap.set(["#p3", "#p4", "#p5", "#stamp", "#end", "#chart"], { opacity: 0 });
      // s1 title (visible at frame 0)
      tl.from("#p1 .big", { scale: 0.6, duration: 0.6, ease: "back.out(1.7)" }, 0);
      tl.to("#p1 .big", { color: "#FF6B6B", scale: 1.15, duration: 0.25, ease: "power4.in" }, 1.9);
      tl.to(["#p1"], { opacity: 0, y: -40, duration: 0.3, ease: IN }, 2.7);
      // s2 people
      tl.fromTo("#pa1", { y: 120, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: E }, 2.95);
      tl.fromTo("#ps1", { y: 120, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: E }, 3.4);
      gsap.set(["#agea", "#ages"], { opacity: 0 });
      tl.fromTo(["#agea", "#ages"], { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2)" }, 4.4);
      tl.to("#people", { opacity: 0, y: -40, duration: 0.3, ease: IN }, 6.6);
      // s3 chart
      tl.to("#p3", { opacity: 1, duration: 0.35 }, 6.95);
      tl.to("#chart", { opacity: 1, duration: 0.35 }, 6.95);
      tl.to("#ca", { attr: { "stroke-dashoffset": 0 }, duration: 5.6, ease: "power1.in" }, 7.1);
      tl.to("#cs", { attr: { "stroke-dashoffset": 0 }, duration: 5.6, ease: "power1.in" }, 7.1);
      tl.from(["#dota", "#dots"], { attr: { r: 0 }, duration: 0.3, ease: "back.out(3)" }, 12.7);
      // s4 fees
      tl.to("#p3", { opacity: 0, duration: 0.25 }, 9.0);
      tl.to("#p4", { opacity: 1, duration: 0.35 }, 9.12);
      tl.from("#p4 .row", { x: 80, opacity: 0, duration: 0.35, stagger: 2.1, ease: E }, 9.12);
      tl.from("#p4 .plus", { scale: 0.6, opacity: 0, duration: 0.35, ease: "back.out(2)" }, 11.9);
      // s5/s6 counters
      tl.to("#p4", { opacity: 0, duration: 0.25 }, 12.95);
      tl.to("#p5", { opacity: 1, duration: 0.3 }, 13.1);
      gsap.set("#lalex", { opacity: 0 });
      money("#vsam", 1281657, 14.1, 1.6);
      tl.to("#dots", { attr: { r: 30 }, duration: 0.3, yoyo: true, repeat: 1 }, 15.5);
      tl.to("#lalex", { opacity: 1, duration: 0.25 }, 16.21);
      money("#valex", 1633601, 16.4, 1.4);
      tl.to("#dota", { attr: { r: 34 }, duration: 0.3, yoyo: true, repeat: 1 }, 17.7);
      tl.to("#valex", { scale: 1.08, transformOrigin: "100% 50%", duration: 0.25, yoyo: true, repeat: 1 }, 17.8);
      // s7 stamp
      tl.to("#chart", { opacity: 0, duration: 0.3 }, 18.36);
      tl.fromTo("#stamp", { opacity: 0, scale: 1.6, rotation: -6 }, { opacity: 1, scale: 1, rotation: -3, duration: 0.35, ease: "power4.in" }, 18.6);
      tl.to("#stamp", { scale: 1.05, duration: 0.25, yoyo: true, repeat: 1 }, 21.6);
      // s8 end
      tl.to(["#stamp", "#p5"], { opacity: 0, duration: 0.3, ease: IN }, 22.5);
      tl.to("#end", { opacity: 1, duration: 0.2 }, 22.78);
      tl.from("#end .num", { scale: 0.7, duration: 0.6, ease: "back.out(1.7)" }, 22.78);
      tl.from("#end .disc", { opacity: 0, duration: 0.4 }, 23.0);
      tl.from("#end .follow", { y: 40, opacity: 0, duration: 0.45, ease: E }, 23.9);
      // captions
      %%CAPJS%%
      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>

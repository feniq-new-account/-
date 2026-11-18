#!/usr/bin/env node
// Render an invitation template to MP4 (+ poster PNG).
//
//   node render.mjs --template emerald-arch --data data.json --out ./out \
//        [--music song.mp3] [--duration 40] [--slow 1.7] [--fps 30] [--workers 3]
//        [--preview 2,8,30]   # only write still PNGs at these video seconds, no video
//
// Templates are plain HTML pages that expose window.seek(seconds) and use {{key}} placeholders.
// --slow stretches the template's own timeline (1.7 = everything 1.7x slower).
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = createRequire(import.meta.url)('playwright');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SKILL = path.resolve(HERE, '..');

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => {
  if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]);
  return acc;
}, []));

const tplArg = args.template || 'emerald-arch';
const tplPath = fs.existsSync(tplArg) ? path.resolve(tplArg) : path.join(SKILL, 'templates', `${tplArg}.html`);
if (!fs.existsSync(tplPath)) throw new Error(`template not found: ${tplArg}`);
const data = args.data ? JSON.parse(fs.readFileSync(args.data, 'utf8')) : {};
const out = path.resolve(args.out || 'out');
const fps = +(args.fps || 30);
const duration = +(args.duration || 40);
const slow = +(args.slow || 1.7);
const workers = +(args.workers || 3);
const name = args.name || path.basename(tplPath, '.html');

// ---- build page ----
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
let html = fs.readFileSync(tplPath, 'utf8');
const keys = [...new Set([...html.matchAll(/{{(\w+)}}/g)].map((m) => m[1]))];
const missing = keys.filter((k) => !(k in data));
if (missing.length) throw new Error(`data.json is missing: ${missing.join(', ')}`);
html = html.replace(/{{(\w+)}}/g, (_, k) => esc(data[k]));
const build = path.join(out, 'build');
fs.mkdirSync(build, { recursive: true });
fs.cpSync(path.join(SKILL, 'fonts'), path.join(build, 'fonts'), { recursive: true });
const assets = path.join(path.dirname(tplPath), 'assets');
if (fs.existsSync(assets)) fs.cpSync(assets, path.join(build, 'assets'), { recursive: true });
// shared libraries (three.js) live in the sibling code-video skill
const lib = path.resolve(SKILL, '..', 'code-video', 'lib');
if (fs.existsSync(lib)) fs.cpSync(lib, path.join(build, 'lib'), { recursive: true });
const page = path.join(build, `${name}.html`);
fs.writeFileSync(page, html);

// Serve the build folder over HTTP: ES modules (three.js) do not load from file:// URLs.
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.ttf': 'font/ttf', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const f = path.join(build, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!f.startsWith(build) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const pageUrl = `http://127.0.0.1:${server.address().port}/${encodeURIComponent(path.basename(page))}`;

async function openPage(browser) {
  const p = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', (e) => console.error('page error:', e.message));
  await p.goto(pageUrl);
  await p.evaluate(() => document.fonts.ready);
  await p.waitForFunction(() => window.__ready !== false, null, { timeout: 120000 });
  await p.waitForTimeout(300);
  return p;
}

// SwiftShader gives headless Chromium a working WebGL2 without a GPU
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
try {
  if (args.preview) {
    const p = await openPage(browser);
    for (const t of String(args.preview).split(',').map(Number)) {
      await p.evaluate((x) => window.seek(x), t / slow);
      const f = path.join(out, `${name}-preview-${t}s.png`);
      await p.screenshot({ path: f });
      console.log(f);
    }
  } else {
    const frames = path.join(out, `frames-${name}`);
    fs.rmSync(frames, { recursive: true, force: true });
    fs.mkdirSync(frames, { recursive: true });
    const total = Math.round(duration * fps);
    const chunk = Math.ceil(total / workers);
    await Promise.all([...Array(workers).keys()].map(async (w) => {
      const p = await openPage(browser);
      for (let i = w * chunk; i < Math.min(total, (w + 1) * chunk); i++) {
        await p.evaluate((x) => window.seek(x), i / fps / slow);
        await p.screenshot({ path: path.join(frames, `f${String(i).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 93 });
      }
    }));
    const mp4 = path.join(out, `${name}.mp4`);
    const ff = ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(frames, 'f%05d.jpg')];
    if (args.music) {
      const fadeAt = Math.max(0, duration - 3.5);
      ff.push('-i', path.resolve(args.music), '-af', `atrim=0:${duration},afade=t=out:st=${fadeAt}:d=3.5`, '-c:a', 'aac', '-b:a', '192k');
    }
    ff.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-pix_fmt', 'yuv420p', '-t', String(duration), '-movflags', '+faststart', mp4);
    execFileSync('ffmpeg', ff, { stdio: 'inherit' });
    fs.copyFileSync(path.join(frames, `f${String(total - 1).padStart(5, '0')}.jpg`), path.join(out, `${name}-poster.jpg`));
    if (!args['keep-frames']) fs.rmSync(frames, { recursive: true, force: true });
    console.log(mp4);
  }
} finally {
  await browser.close();
  server.close();
}

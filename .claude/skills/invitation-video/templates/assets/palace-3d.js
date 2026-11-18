// Procedural 3-D palace hall for invitation videos (Three.js, deterministic: render3d(t) draws time t).
// Everything is generated in code: geometry, marble texture, flowers, light. No image assets.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const cfg = Object.assign({
  width: 1080, height: 1920,           // internal render size; 720x1280 renders ~2x faster for drafts
  palette: {
    fog: '#ecd0cf', wall: '#efcfd0', column: '#fbf0ea', door: '#eab3b9', gold: '#d8b06a',
    roses: ['#f3bcc4', '#f7d3d8', '#fbe8ea', '#eaa8b3', '#ffffff', '#f5c9cf'], leaf: '#93a98d',
    blossom: ['#f6c3cc', '#f9d9de', '#f2b0bd', '#fde9ec'], glow: [3.2, 2.7, 2.4], window: [1.5, 1.32, 1.3],
  },
}, window.PALACE_CFG || {});
const P = cfg.palette;

// ---------- utils ----------
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const R = rng(20261216);
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = (k) => k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k);
const clamp01 = (k) => Math.min(1, Math.max(0, k));
// Catmull-Rom through [t, v] keys (smooth velocity, no jumps)
function track(keys) {
  return (t) => {
    if (t <= keys[0][0]) return keys[0][1];
    if (t >= keys[keys.length - 1][0]) {        // extend past the last key: same velocity, gentle stop (frames before stay identical)
      const L = keys[keys.length - 1], Pk = keys[keys.length - 2], v = (L[1] - Pk[1]) / (L[0] - Pk[0]);
      const T = Math.min(t - L[0], 12); return L[1] + v * (T - T * T / 24);
    }
    let i = 0; while (t > keys[i + 1][0]) i++;
    const k0 = keys[Math.max(0, i - 1)], k1 = keys[i], k2 = keys[i + 1], k3 = keys[Math.min(keys.length - 1, i + 2)];
    const u = (t - k1[0]) / (k2[0] - k1[0]);
    const m1 = (k2[1] - k0[1]) / (k2[0] - k0[0]) * (k2[0] - k1[0]);
    const m2 = (k3[1] - k1[1]) / (k3[0] - k1[0]) * (k2[0] - k1[0]);
    const u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * k1[1] + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * k2[1] + (u3 - u2) * m2;
  };
}
const hdr = (rgb) => new THREE.Color(rgb[0], rgb[1], rgb[2]);

// ---------- renderer / scene ----------
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(cfg.width, cfg.height, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = cfg.exposure ?? 0.82;

const scene = new THREE.Scene();
scene.background = new THREE.Color(P.fog);
scene.fog = new THREE.FogExp2(P.fog, cfg.fogDensity ?? 0.011);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.55;

const camera = new THREE.PerspectiveCamera(60, cfg.width / cfg.height, 0.1, 220);

scene.add(new THREE.HemisphereLight('#fff4f0', '#c99da2', 0.6));
const sun = new THREE.DirectionalLight('#fff1e6', 1.1); sun.position.set(0, 14, -80); sun.target.position.set(0, 0, 0);
scene.add(sun, sun.target);

const world = new THREE.Group();   // everything that is mirrored in the floor
scene.add(world);

// ---------- materials ----------
const M = {
  wall: new THREE.MeshStandardMaterial({ color: P.wall, roughness: 0.6 }),
  col: new THREE.MeshStandardMaterial({ color: P.column, roughness: 0.42 }),
  gold: new THREE.MeshStandardMaterial({ color: P.gold, metalness: 1, roughness: 0.28 }),
  door: new THREE.MeshStandardMaterial({ color: P.door, roughness: 0.45 }),
  glow: new THREE.MeshBasicMaterial({ color: hdr(P.glow), fog: false }),
  win: new THREE.MeshBasicMaterial({ color: hdr(P.window) }),
  leaf: new THREE.MeshStandardMaterial({ color: P.leaf, roughness: 0.7 }),
  rose: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.55 }),
  crystal: new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: new THREE.Color(1.25, 1.08, 0.95), roughness: 0.1, metalness: 0.2 }),
  curtain: new THREE.MeshStandardMaterial({ color: '#fffaf8', roughness: 0.9, transparent: true, opacity: 0.88, side: THREE.DoubleSide, emissive: new THREE.Color('#fff2ee'), emissiveIntensity: 0.35 }),
  branch: new THREE.MeshStandardMaterial({ color: '#8a6a63', roughness: 0.9 }),
};

function box(w, h, d, mat, x, y, z, parent = world) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m; }
function instanced(geo, mat, n, fill, parent = world) {
  const im = new THREE.InstancedMesh(geo, mat, n); const d = new THREE.Object3D(); const c = new THREE.Color();
  for (let i = 0; i < n; i++) { fill(i, d, c); d.updateMatrix(); im.setMatrixAt(i, d.matrix); im.setColorAt(i, c); }
  im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; parent.add(im); return im;
}
const pick = (arr) => arr[Math.floor(R() * arr.length)];

// ---------- marble floor (canvas texture) ----------
function marbleTexture() {
  const s = 1024, cv = document.createElement('canvas'); cv.width = cv.height = s; const g = cv.getContext('2d');
  g.fillStyle = '#f7eeec'; g.fillRect(0, 0, s, s);
  // diamond inlay
  g.fillStyle = '#e8bcc1';
  for (const [cx, cy] of [[s / 2, s / 2], [0, 0], [s, 0], [0, s], [s, s]]) { g.beginPath(); g.moveTo(cx, cy - s * 0.34); g.lineTo(cx + s * 0.34, cy); g.lineTo(cx, cy + s * 0.34); g.lineTo(cx - s * 0.34, cy); g.closePath(); g.fill(); }
  g.strokeStyle = 'rgba(214,170,120,.55)'; g.lineWidth = 3;
  for (const [cx, cy] of [[s / 2, s / 2]]) { g.beginPath(); g.moveTo(cx, cy - s * 0.34); g.lineTo(cx + s * 0.34, cy); g.lineTo(cx, cy + s * 0.34); g.lineTo(cx - s * 0.34, cy); g.closePath(); g.stroke(); }
  // veins
  g.filter = 'blur(1.2px)';
  for (let i = 0; i < 26; i++) {
    g.strokeStyle = `rgba(${150 + R() * 50},${120 + R() * 40},${125 + R() * 40},${0.08 + R() * 0.12})`; g.lineWidth = 0.6 + R() * 2.2;
    g.beginPath(); let x = R() * s, y = R() * s; g.moveTo(x, y);
    for (let k = 0; k < 6; k++) { const nx = x + (R() - 0.3) * 260, ny = y + (R() - 0.5) * 260; g.quadraticCurveTo((x + nx) / 2 + (R() - 0.5) * 80, (y + ny) / 2 + (R() - 0.5) * 80, nx, ny); x = nx; y = ny; }
    g.stroke();
  }
  g.filter = 'none';
  // tile seams
  g.strokeStyle = 'rgba(190,160,160,.25)'; g.lineWidth = 2; g.strokeRect(0, 0, s, s);
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 32); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const floor = new THREE.Mesh(new THREE.PlaneGeometry(17.2, 136), new THREE.MeshStandardMaterial({ map: marbleTexture(), color: '#eedcdb', roughness: 0.22, metalness: 0, envMapIntensity: 0.25, transparent: true, opacity: 0.62 }));
floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -58); floor.renderOrder = 2;
scene.add(floor);

// ---------- hall shell ----------
const HALL_W = 8.6, HALL_END = -70, VAULT_Y = 10.4;
for (const s of [-1, 1]) box(0.4, 22, 140, M.wall, s * (HALL_W + 0.2), 11, -60);           // side walls
const vault = new THREE.Mesh(new THREE.CylinderGeometry(HALL_W, HALL_W, 140, 56, 1, true, Math.PI / 2, Math.PI), new THREE.MeshStandardMaterial({ color: '#f3d9d9', roughness: 0.7, side: THREE.BackSide }));
vault.rotation.x = Math.PI / 2; vault.position.set(0, VAULT_Y, -60); world.add(vault);
// vault ribs
for (let z = -5; z > HALL_END; z -= 7) {
  const rib = new THREE.Mesh(new THREE.TorusGeometry(HALL_W - 0.05, 0.16, 8, 64, Math.PI), M.col); rib.position.set(0, VAULT_Y, z); world.add(rib);
  const ribG = new THREE.Mesh(new THREE.TorusGeometry(HALL_W - 0.22, 0.035, 6, 64, Math.PI), M.gold); ribG.position.set(0, VAULT_Y, z); world.add(ribG);
}

// side windows (glowing arches) between columns
function archShape(w, h) { const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(-w / 2, h - w / 2); s.absarc(0, h - w / 2, w / 2, Math.PI, 0, true); s.lineTo(w / 2, 0); s.closePath(); return s; }
const winGeo = new THREE.ShapeGeometry(archShape(3.2, 6.8), 24);
for (let z = -8.5; z > HALL_END + 4; z -= 7) for (const s of [-1, 1]) {
  const w = new THREE.Mesh(winGeo, M.win); w.position.set(s * (HALL_W - 0.01), 1.4, z); w.rotation.y = -s * Math.PI / 2; world.add(w);
  const fr = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.06, 6, 32, Math.PI), M.gold); fr.position.set(s * (HALL_W - 0.05), 1.4 + 6.8 - 1.6, z); fr.rotation.y = Math.PI / 2; world.add(fr);
}

// ---------- columns + arcades ----------
const COL_X = 5.6, colZ = []; for (let z = -5; z > HALL_END + 3; z -= 7) colZ.push(z);
const shaftGeo = new THREE.CylinderGeometry(0.46, 0.5, 7.9, 28), baseGeo = new THREE.BoxGeometry(1.3, 0.55, 1.3), capGeo = new THREE.BoxGeometry(1.3, 0.38, 1.3);
const ringGeo = new THREE.TorusGeometry(0.5, 0.06, 8, 28);
for (const z of colZ) for (const s of [-1, 1]) {
  const x = s * COL_X;
  const b = new THREE.Mesh(baseGeo, M.col); b.position.set(x, 0.275, z); world.add(b);
  const sh = new THREE.Mesh(shaftGeo, M.col); sh.position.set(x, 0.55 + 3.95, z); world.add(sh);
  const c = new THREE.Mesh(capGeo, M.col); c.position.set(x, 8.64, z); world.add(c);
  for (const y of [0.62, 8.38]) { const r = new THREE.Mesh(ringGeo, M.gold); r.rotation.x = Math.PI / 2; r.position.set(x, y, z); world.add(r); }
}
const arcGeo = new THREE.TorusGeometry(3.5, 0.32, 10, 40, Math.PI), arcGold = new THREE.TorusGeometry(3.12, 0.04, 6, 40, Math.PI);
for (let i = 0; i < colZ.length - 1; i++) for (const s of [-1, 1]) {
  const zc = (colZ[i] + colZ[i + 1]) / 2;
  const a = new THREE.Mesh(arcGeo, M.col); a.rotation.y = Math.PI / 2; a.position.set(s * COL_X, 8.83, zc); world.add(a);
  const g = new THREE.Mesh(arcGold, M.gold); g.rotation.y = Math.PI / 2; g.position.set(s * COL_X, 8.83, zc); world.add(g);
}
box(0.9, 0.5, colZ[0] - colZ[colZ.length - 1] + 1.4, M.col, -COL_X, 12.6, (colZ[0] + colZ[colZ.length - 1]) / 2).visible = false;

// ---------- sconces (candles + glow sprites) ----------
function glowTexture() { const s = 128, cv = document.createElement('canvas'); cv.width = cv.height = s; const g = cv.getContext('2d'); const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, 'rgba(255,240,220,1)'); gr.addColorStop(0.25, 'rgba(255,220,190,.55)'); gr.addColorStop(1, 'rgba(255,210,190,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); return new THREE.CanvasTexture(cv); }
const glowTex = glowTexture();
const glowMat = new THREE.SpriteMaterial({ map: glowTex, color: '#ffe4cc', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
const flameGeo = new THREE.SphereGeometry(0.07, 10, 8), candleGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.35, 10);
for (const z of colZ) for (const s of [-1, 1]) for (const dz of [-0.28, 0.28]) {
  const x = s * (COL_X - 0.62);
  const arm = box(0.05, 0.05, 0.3, M.gold, x, 4.55, z + dz * 0.5);
  const cd = new THREE.Mesh(candleGeo, M.col); cd.position.set(x, 4.75, z + dz); world.add(cd);
  const fl = new THREE.Mesh(flameGeo, M.glow); fl.scale.y = 1.6; fl.position.set(x, 5.0, z + dz); world.add(fl);
  const sp = new THREE.Sprite(glowMat); sp.scale.set(1.1, 1.1, 1); sp.position.set(x, 5.0, z + dz); world.add(sp);
}

// ---------- chandeliers ----------
const octa = new THREE.OctahedronGeometry(0.075, 0);
const chandeliers = [];
for (const cz of [-10, -24, -38, -52]) {
  const ch = new THREE.Group(); ch.position.set(0, 8.3, cz); world.add(ch); chandeliers.push(ch);
  box(0.06, 3.0, 0.06, M.gold, 0, 3.0, 0, ch);
  const rings = [[1.5, 0.0, 40], [1.08, 0.6, 30], [0.66, 1.15, 20], [0.3, 1.6, 10]];
  const pos = [];
  for (const [r, y, n] of rings) {
    const tor = new THREE.Mesh(new THREE.TorusGeometry(r, 0.035, 6, 48), M.gold); tor.rotation.x = Math.PI / 2; tor.position.y = y; ch.add(tor);
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; for (let k = 0; k < 4; k++) pos.push([Math.cos(a) * r, y - 0.12 - k * 0.16, Math.sin(a) * r, k]); }
    for (let i = 0; i < n / 2; i++) { const a = (i + 0.5) / (n / 2) * Math.PI * 2; const fl = new THREE.Mesh(flameGeo, M.glow); fl.position.set(Math.cos(a) * r, y + 0.16, Math.sin(a) * r); ch.add(fl); }
  }
  for (let k = 0; k < 9; k++) pos.push([0, -0.2 - k * 0.17, 0, k]);
  instanced(octa, M.crystal, pos.length, (i, d, c) => { const p = pos[i]; d.position.set(p[0], p[1], p[2]); d.scale.setScalar(1 - p[3] * 0.08); d.rotation.y = i; c.set('#ffffff'); }, ch);
  const halo = new THREE.Sprite(glowMat); halo.scale.set(6, 6, 1); halo.position.y = 0.6; ch.add(halo);
  const pl = new THREE.PointLight('#ffe6d2', 28, 22, 2); pl.position.y = 0.4; ch.add(pl);
}

// ---------- roses ----------
const roseGeo = new THREE.IcosahedronGeometry(1, 3);
{ // give the sphere a rose-like swirl: squash + spiral ridges
  const p = roseGeo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const a = Math.atan2(v.z, v.x); const ridge = 1 + 0.07 * Math.sin(a * 5 + v.y * 9); v.multiplyScalar(ridge); v.y *= 0.82; p.setXYZ(i, v.x, v.y, v.z); }
  roseGeo.computeVertexNormals();
}
const leafGeo = new THREE.SphereGeometry(1, 8, 6);
function roseDome(cx, cy, cz, radius, count, parentRoses, parentLeaves) {
  for (let i = 0; i < count; i++) {
    const u = R(), th = R() * Math.PI * 2, ph = Math.acos(1 - u * 1.15); // upper dome, a bit below equator
    const r = radius * (0.92 + R() * 0.12), s = 0.13 + R() * 0.09;
    parentRoses.push([cx + Math.sin(ph) * Math.cos(th) * r, cy + Math.cos(ph) * r * 0.85, cz + Math.sin(ph) * Math.sin(th) * r, s, pick(P.roses)]);
  }
  for (let i = 0; i < count * 0.35; i++) {
    const th = R() * Math.PI * 2, r = radius * (0.95 + R() * 0.15);
    parentLeaves.push([cx + Math.cos(th) * r, cy - 0.05 + R() * 0.25, cz + Math.sin(th) * r, th]);
  }
}
const roses = [], leaves = [];
// urns + domes along the aisle
const urnGeo = new THREE.LatheGeometry([[0, 0], [0.45, 0], [0.5, 0.08], [0.22, 0.25], [0.18, 0.9], [0.32, 1.05], [0.62, 1.25], [0.7, 1.4], [0.6, 1.48], [0, 1.48]].map(([x, y]) => new THREE.Vector2(x, y)), 28);
for (let z = -8.5; z > HALL_END + 6; z -= 7) for (const s of [-1, 1]) {
  const x = s * 3.7;
  const plinth = box(0.9, 0.9, 0.9, M.col, x, 0.45, z);
  const urn = new THREE.Mesh(urnGeo, M.col); urn.position.set(x, 0.9, z); world.add(urn);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.03, 6, 24), M.gold); band.rotation.x = Math.PI / 2; band.position.set(x, 2.3, z); world.add(band);
  roseDome(x, 2.42, z, 0.95, 120, roses, leaves);
}
// low rose hedges along the aisle edges
for (let z = -2; z > HALL_END + 6; z -= 0.42) for (const s of [-1, 1]) {
  if (((z + 8.5) % 7 + 7) % 7 < 1.2) continue;
  roses.push([s * (3.7 + (R() - 0.5) * 0.3), 0.25 + R() * 0.25, z + (R() - 0.5) * 0.2, 0.15 + R() * 0.06, pick(P.roses)]);
  if (R() < 0.5) leaves.push([s * (3.7 + (R() - 0.5) * 0.4), 0.15, z, R() * 6]);
}

// ---------- entrance wall + doors ----------
const DOOR_W = 2.2, DOOR_H = 7.4, WALL_Z = 0;
const ENT0 = world.children.length;
box(HALL_W - DOOR_W, 22, 0.7, M.wall, -(DOOR_W + (HALL_W - DOOR_W) / 2), 11, WALL_Z - 0.35);
box(HALL_W - DOOR_W, 22, 0.7, M.wall, (DOOR_W + (HALL_W - DOOR_W) / 2), 11, WALL_Z - 0.35);
box(DOOR_W * 2, 22 - DOOR_H, 0.7, M.wall, 0, DOOR_H + (22 - DOOR_H) / 2, WALL_Z - 0.35);
for (const s of [-1, 1]) {           // pilasters + door frame
  box(0.7, DOOR_H + 1.6, 0.35, M.col, s * (DOOR_W + 0.95), (DOOR_H + 1.6) / 2, WALL_Z + 0.15);
  box(0.82, 0.3, 0.42, M.gold, s * (DOOR_W + 0.95), DOOR_H + 1.65, WALL_Z + 0.16);
  box(0.16, DOOR_H + 0.2, 0.2, M.gold, s * (DOOR_W + 0.1), (DOOR_H + 0.2) / 2, WALL_Z + 0.08);
  // lanterns
  const lx = s * (DOOR_W + 2.2);
  box(0.42, 0.7, 0.42, M.gold, lx, 4.3, WALL_Z + 0.45).material = M.gold;
  const lg = box(0.32, 0.56, 0.32, M.glow, lx, 4.3, WALL_Z + 0.46);
  const sp = new THREE.Sprite(glowMat); sp.scale.set(2.6, 2.6, 1); sp.position.set(lx, 4.3, WALL_Z + 0.7); world.add(sp);
}
box(DOOR_W * 2 + 0.3, 0.22, 0.24, M.gold, 0, DOOR_H + 0.1, WALL_Z + 0.08);
const pedArc = new THREE.Mesh(new THREE.TorusGeometry(DOOR_W + 0.3, 0.2, 10, 48, Math.PI), M.col); pedArc.position.set(0, DOOR_H + 0.3, WALL_Z + 0.15); world.add(pedArc);
const pedArcG = new THREE.Mesh(new THREE.TorusGeometry(DOOR_W + 0.05, 0.05, 6, 48, Math.PI), M.gold); pedArcG.position.set(0, DOOR_H + 0.3, WALL_Z + 0.2); world.add(pedArcG);
const tymp = new THREE.Mesh(new THREE.CircleGeometry(DOOR_W + 0.1, 40, 0, Math.PI), new THREE.MeshStandardMaterial({ color: '#f3d9da', roughness: 0.6 })); tymp.position.set(0, DOOR_H + 0.3, WALL_Z + 0.05); world.add(tymp);
const rosette = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.07, 8, 24), M.gold); rosette.position.set(0, DOOR_H + 1.2, WALL_Z + 0.12); world.add(rosette);
const ENT1 = world.children.length;
const G0 = roses.length, LG0 = leaves.length;
// garland of roses around the doorway
for (let i = 0; i < 360; i++) {
  const u = i / 359; let x, y;
  const arcLen = Math.PI * (DOOR_W + 0.6), side = DOOR_H + 0.3, total = side * 2 + arcLen, d = u * total;
  if (d < side) { x = -(DOOR_W + 0.6); y = d; } else if (d < side + arcLen) { const a = Math.PI - (d - side) / arcLen * Math.PI; x = Math.cos(a) * (DOOR_W + 0.6); y = DOOR_H + 0.3 + Math.sin(a) * (DOOR_W + 0.6); } else { x = DOOR_W + 0.6; y = side - (d - side - arcLen); }
  const j = (R() - 0.5) * 0.5;
  if (y < 1.2 && R() < 0.5) continue;
  roses.push([x + j, y + (R() - 0.5) * 0.4, WALL_Z + 0.35 + R() * 0.2, 0.12 + R() * 0.08, pick(P.roses)]);
  if (R() < 0.6) leaves.push([x + (R() - 0.5) * 0.7, y + (R() - 0.5) * 0.5, WALL_Z + 0.3, R() * 6]);
}
const G1 = roses.length, LG1 = leaves.length;
// flower urns beside the door
for (const s of [-1, 1]) { const x = s * (DOOR_W + 2.2); const urn = new THREE.Mesh(urnGeo, M.col); urn.position.set(x, 0, WALL_Z + 1.1); world.add(urn); roseDome(x, 1.52, WALL_Z + 1.1, 0.85, 100, roses, leaves); }

const rosesMesh = instanced(roseGeo, M.rose, roses.length, (i, d, c) => { const r = roses[i]; d.position.set(r[0], r[1], r[2]); d.scale.setScalar(r[3]); d.rotation.set(R() * 6, R() * 6, R() * 6); c.set(r[4]); });
const leavesMesh = instanced(leafGeo, M.leaf, leaves.length, (i, d, c) => { const l = leaves[i]; d.position.set(l[0], l[1], l[2]); d.scale.set(0.16, 0.035, 0.07); d.rotation.set(R() * 0.6, l[3], R() * 0.8 - 0.4); c.set(P.leaf).offsetHSL(0, 0, (R() - 0.5) * 0.08); });

// doors
function panelFrame(parent, w, h, x, y, z) {
  const t = 0.05;
  box(w, t, 0.04, M.gold, x, y + h / 2, z, parent); box(w, t, 0.04, M.gold, x, y - h / 2, z, parent);
  box(t, h, 0.04, M.gold, x - w / 2, y, z, parent); box(t, h, 0.04, M.gold, x + w / 2, y, z, parent);
}
// ---- carved door leaves: canvas-painted ornament (colour + bump), arched top like a real palace door ----
const R2 = rng(4242);                       // separate stream: the hall's random layout stays identical
const LEAF_W = 2.2, LEAF_SIDE = 7.4, LEAF_TOP = 8.8, PXM = 1024 / LEAF_W;
function doorCanvas(mode, flip) {
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = Math.round(LEAF_TOP * PXM); const g = cv.getContext('2d');
  const bump = mode === 'bump', X = (m) => m * PXM, Y = (m) => (LEAF_TOP - m) * PXM, S = (m) => m * PXM;
  if (flip) { g.translate(1024, 0); g.scale(-1, 1); }
  if (bump) { g.fillStyle = '#000'; g.fillRect(0, 0, 1024, cv.height); }
  else {
    const gr = g.createLinearGradient(0, 0, 1024, 0); gr.addColorStop(0, '#e5aab2'); gr.addColorStop(0.5, '#efbec4'); gr.addColorStop(1, '#e8b0b7');
    g.fillStyle = gr; g.fillRect(0, 0, 1024, cv.height);
    const rg = g.createRadialGradient(512, cv.height * 0.45, 50, 512, cv.height * 0.45, cv.height * 0.6); rg.addColorStop(0, 'rgba(255,240,240,.25)'); rg.addColorStop(1, 'rgba(160,90,100,.12)');
    g.fillStyle = rg; g.fillRect(0, 0, 1024, cv.height);
  }
  const CREAM = '#f8ecdc', GOLD = '#c99b4f';
  const lift = (lv) => { if (bump) { const v = Math.round(255 * lv); g.fillStyle = g.strokeStyle = `rgb(${v},${v},${v})`; g.shadowColor = 'transparent'; } else { g.fillStyle = g.strokeStyle = CREAM; g.shadowColor = 'rgba(105,45,52,.5)'; g.shadowBlur = 9; g.shadowOffsetX = 3; g.shadowOffsetY = 5; } };
  const flat = () => { g.shadowColor = 'transparent'; };
  // ---- ornament primitives (metres) ----
  function scroll(cx, cy, R, rot, dir) {            // tapered C-scroll: discs along a spiral
    lift(0.95);
    for (let k = 0; k <= 70; k++) { const a = k / 70 * 2.7 * Math.PI, r = R * (1 - a / (3.1 * Math.PI)), w = R * 0.16 * (1 - k / 85);
      const x = cx + Math.cos(a * dir + rot) * r, y = cy + Math.sin(a * dir + rot) * r; g.beginPath(); g.arc(X(x), Y(y), S(w), 0, 7); g.fill(); }
    if (!bump) { flat(); g.strokeStyle = GOLD; g.lineWidth = 1.6; g.beginPath(); for (let k = 0; k <= 70; k++) { const a = k / 70 * 2.7 * Math.PI, r = R * (1 - a / (3.1 * Math.PI)); const x = cx + Math.cos(a * dir + rot) * r, y = cy + Math.sin(a * dir + rot) * r; k ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)); } g.stroke(); }
  }
  function leaf(cx, cy, len, ang, w = 0.32) {        // acanthus-like lobed leaf
    lift(0.85); g.save(); g.translate(X(cx), Y(cy)); g.rotate(-ang); const L = S(len), W = L * w;
    g.beginPath(); g.moveTo(0, 0);
    g.bezierCurveTo(L * 0.2, -W, L * 0.35, -W * 0.4, L * 0.45, -W * 0.85); g.bezierCurveTo(L * 0.55, -W * 0.3, L * 0.7, -W * 0.7, L * 0.78, -W * 0.45);
    g.quadraticCurveTo(L * 0.92, -W * 0.25, L, 0);
    g.quadraticCurveTo(L * 0.92, W * 0.25, L * 0.78, W * 0.45); g.bezierCurveTo(L * 0.7, W * 0.7, L * 0.55, W * 0.3, L * 0.45, W * 0.85);
    g.bezierCurveTo(L * 0.35, W * 0.4, L * 0.2, W, 0, 0); g.fill();
    if (!bump) { flat(); g.strokeStyle = GOLD; g.lineWidth = 1.4; g.beginPath(); g.moveTo(L * 0.05, 0); g.quadraticCurveTo(L * 0.5, -W * 0.12, L * 0.95, 0); g.stroke(); }
    g.restore();
  }
  function rose(cx, cy, r) {                         // carved rose: disc + spiral petal cuts
    lift(1.0); g.beginPath(); g.arc(X(cx), Y(cy), S(r), 0, 7); g.fill();
    if (bump) { g.fillStyle = 'rgb(170,170,170)'; } else { flat(); g.strokeStyle = 'rgba(150,95,95,.55)'; }
    g.lineWidth = bump ? S(r) * 0.12 : 1.6;
    for (let k = 0; k < 4; k++) { const rr = S(r) * (0.85 - k * 0.2); g.beginPath(); g.arc(X(cx), Y(cy), rr, k * 1.3, k * 1.3 + 4.6); bump ? (g.strokeStyle = 'rgb(140,140,140)', g.stroke()) : g.stroke(); }
    if (!bump) { g.strokeStyle = GOLD; g.lineWidth = 1.2; g.beginPath(); g.arc(X(cx), Y(cy), S(r), 0, 7); g.stroke(); }
  }
  function bow(cx, cy, s) {
    lift(0.9);
    for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(X(cx + sd * s * 0.55), Y(cy + s * 0.05), S(s * 0.55), S(s * 0.28), sd * -0.35, 0, 7); g.fill();
      g.beginPath(); g.moveTo(X(cx), Y(cy)); g.bezierCurveTo(X(cx + sd * s * 0.2), Y(cy - s * 0.6), X(cx + sd * s * 0.7), Y(cy - s * 0.7), X(cx + sd * s * 0.75), Y(cy - s * 1.3));
      g.lineTo(X(cx + sd * s * 0.55), Y(cy - s * 1.25)); g.bezierCurveTo(X(cx + sd * s * 0.45), Y(cy - s * 0.7), X(cx + sd * s * 0.1), Y(cy - s * 0.55), X(cx), Y(cy)); g.fill(); }
    rose(cx, cy, s * 0.22);
  }
  function bouquet(cx, cy, s) {
    for (let k = 0; k < 11; k++) { const a = Math.PI / 2 + (k - 5) * 0.32; leaf(cx, cy - 0.05 * s, 0.52 * s, a, 0.3); }
    for (const [dx, dy, r] of [[0, 0.06, 0.13], [-0.17, -0.03, 0.105], [0.17, -0.03, 0.105], [-0.09, 0.22, 0.09], [0.09, 0.22, 0.09], [0, 0.36, 0.075], [-0.24, 0.16, 0.07], [0.24, 0.16, 0.07], [0, -0.17, 0.09]])
      rose(cx + dx * s, cy + dy * s, r * s);
    bow(cx, cy - 0.34 * s, 0.17 * s);
  }
  function rosetteSmall(cx, cy, r) { for (let k = 0; k < 8; k++) leaf(cx, cy, r * 1.9, k * Math.PI / 4, 0.42); rose(cx, cy, r * 0.75); }
  // ---- panel moldings ----
  function molding(pathAt) {
    lift(0.7); g.lineWidth = 30; g.stroke(pathAt(0));
    lift(1.0); g.lineWidth = 8; g.stroke(pathAt(24));
    if (!bump) { flat(); g.strokeStyle = GOLD; g.lineWidth = 5; g.stroke(pathAt(9)); g.strokeStyle = 'rgba(255,250,242,.9)'; g.lineWidth = 2; g.stroke(pathAt(-10)); }
  }
  const notch = (x0, y0, x1, y1, c = 0.09) => (d) => { const D = d / PXM, a = X(x0 + D), b = X(x1 - D), t = Y(y1 - D), u = Y(y0 + D), r = S(c), p = new Path2D();
    p.moveTo(a + r, t); p.lineTo(b - r, t); p.arc(b, t, r, Math.PI, Math.PI / 2, true); p.lineTo(b, u - r); p.arc(b, u, r, -Math.PI / 2, Math.PI, true);
    p.lineTo(a + r, u); p.arc(a, u, r, 0, -Math.PI / 2, true); p.lineTo(a, t + r); p.arc(a, t, r, Math.PI / 2, 0, true); p.closePath(); return p; };
  const archPanel = (x0, y0, x1) => (d) => { const D = d / PXM, rx = LEAF_W - 0.26 - D, ry = (LEAF_TOP - LEAF_SIDE) - 0.26 - D, k = Math.min(0.99, (LEAF_W - (x1 - D)) / rx), p = new Path2D();
    p.moveTo(X(x0 + D), Y(y0 + D)); p.lineTo(X(x0 + D), Y(LEAF_SIDE)); p.ellipse(X(LEAF_W), Y(LEAF_SIDE), S(rx), S(ry), 0, Math.PI, Math.PI + Math.acos(k), false);
    p.lineTo(X(x1 - D), Y(y0 + D)); p.closePath(); return p; };
  const tallPanel = (x0, y0, x1, y1, bulge) => (d) => { const D = d / PXM, a = X(x0 + D), b = X(x1 - D), u = Y(y0 + D), t = Y(y1 - D), m = (a + b) / 2, p = new Path2D(), r = S(0.09);
    p.moveTo(a, t); p.quadraticCurveTo(m, t - S(bulge) * 2, b, t); p.lineTo(b, u - r); p.arc(b, u, r, -Math.PI / 2, Math.PI, true); p.lineTo(a + r, u); p.arc(a, u, r, 0, -Math.PI / 2, true); p.closePath(); return p; };
  // outer edge bead all round the leaf
  lift(0.55); g.lineWidth = 16; g.strokeRect(8, 8, 1024 - 16, cv.height - 16);
  // 1) arched top panel
  molding(archPanel(0.27, 6.62, 1.93));
  scroll(0.62, 7.0, 0.16, 0.6, 1); scroll(1.58, 7.0, 0.16, 2.5, -1); leaf(0.75, 7.0, 0.38, 0.5); leaf(1.45, 7.0, 0.38, Math.PI - 0.5); rosetteSmall(1.1, 7.42, 0.12);
  leaf(1.1, 7.62, 0.3, Math.PI / 2, 0.36);
  // 2) small horizontal panel
  molding(notch(0.27, 5.72, 1.93, 6.38));
  rosetteSmall(1.1, 6.05, 0.1); leaf(0.98, 6.05, 0.5, Math.PI, 0.3); leaf(1.22, 6.05, 0.5, 0, 0.3); scroll(0.52, 6.05, 0.1, 0, 1); scroll(1.68, 6.05, 0.1, Math.PI, -1);
  // 3) tall panel with medallion bouquet
  molding(tallPanel(0.27, 2.0, 1.93, 5.3, 0.16));
  lift(0.75); g.lineWidth = 20; g.beginPath(); g.ellipse(X(1.1), Y(3.7), S(0.58), S(0.98), 0, 0, 7); g.stroke();
  lift(1.0); g.lineWidth = 6; g.beginPath(); g.ellipse(X(1.1), Y(3.7), S(0.5), S(0.9), 0, 0, 7); g.stroke();
  if (!bump) { flat(); g.strokeStyle = GOLD; g.lineWidth = 2.6; g.beginPath(); g.ellipse(X(1.1), Y(3.7), S(0.555), S(0.955), 0, 0, 7); g.stroke(); }
  bouquet(1.1, 3.72, 1.0);
  scroll(0.8, 4.92, 0.13, 0.3, 1); scroll(1.4, 4.92, 0.13, 2.8, -1); rosetteSmall(1.1, 4.98, 0.09);
  leaf(1.1, 2.55, 0.42, -Math.PI / 2, 0.3); scroll(0.7, 2.35, 0.12, -0.6, 1); scroll(1.5, 2.35, 0.12, 3.7, -1);
  for (const [x, y] of [[0.48, 5.0], [1.72, 5.0], [0.48, 2.25], [1.72, 2.25]]) rose(x, y, 0.045);
  // 4) bottom panel
  molding(notch(0.27, 0.38, 1.93, 1.68));
  rosetteSmall(1.1, 1.03, 0.11); leaf(0.95, 1.03, 0.45, Math.PI, 0.3); leaf(1.25, 1.03, 0.45, 0, 0.3);
  for (const [x, y, rt, dr] of [[0.55, 1.4, -0.5, 1], [1.65, 1.4, 3.6, -1], [0.55, 0.66, 0.5, -1], [1.65, 0.66, 2.6, 1]]) scroll(x, y, 0.1, rt, dr);
  if (bump) { const c2 = document.createElement('canvas'); c2.width = cv.width; c2.height = cv.height; const g2 = c2.getContext('2d'); g2.filter = 'blur(2.5px)'; g2.drawImage(cv, 0, 0); return c2; }
  return cv;
}
function doorMaterial(flip) {
  const map = new THREE.CanvasTexture(doorCanvas('color', flip)), bmp = new THREE.CanvasTexture(doorCanvas('bump', flip));
  for (const t of [map, bmp]) { t.repeat.set(1 / LEAF_W, 1 / LEAF_TOP); t.anisotropy = 8; }
  map.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map, bumpMap: bmp, bumpScale: 3.2, roughness: 0.48, metalness: 0.02 });
}
function leafShape(side) {
  const s = new THREE.Shape();
  if (side < 0) { s.moveTo(0, 0); s.lineTo(LEAF_W, 0); s.lineTo(LEAF_W, LEAF_TOP); s.absellipse(LEAF_W, LEAF_SIDE, LEAF_W, LEAF_TOP - LEAF_SIDE, Math.PI / 2, Math.PI, false); s.lineTo(0, 0); }
  else { s.moveTo(0, 0); s.lineTo(LEAF_W, 0); s.lineTo(LEAF_W, LEAF_SIDE); s.absellipse(0, LEAF_SIDE, LEAF_W, LEAF_TOP - LEAF_SIDE, 0, Math.PI / 2, false); s.lineTo(0, 0); }
  return s;
}
function ornateHandle(parent, x) {
  const grp = new THREE.Group(); grp.position.set(x, 3.75, 0.13); parent.add(grp);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 1.5, 16), M.gold); grp.add(bar);
  for (const y of [-0.75, 0.75]) { const k = new THREE.Mesh(new THREE.SphereGeometry(0.065, 16, 12), M.gold); k.position.y = y; grp.add(k); const f = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 12), M.gold); f.position.y = y + Math.sign(y) * 0.11; f.rotation.z = y > 0 ? 0 : Math.PI; grp.add(f); }
  for (const y of [-0.45, -0.15, 0.15, 0.45]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.048, 0.014, 8, 20), M.gold); r.rotation.x = Math.PI / 2; r.position.y = y; grp.add(r); }
  for (const y of [-0.58, 0.58]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.13), M.gold); b.position.set(0, y, -0.065); grp.add(b); const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 20), M.gold); pl.rotation.x = Math.PI / 2; pl.position.set(0, y, -0.12); grp.add(pl); }
}
function makeDoor(side) {      // side -1 = left (hinge at -LEAF_W), +1 = right
  const pivot = new THREE.Group(); pivot.position.set(side * DOOR_W, 0, WALL_Z + 0.02); world.add(pivot);
  const geo = new THREE.ExtrudeGeometry(leafShape(side), { depth: 0.14, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2, curveSegments: 48 });
  const mesh = new THREE.Mesh(geo, [doorMaterial(side > 0), M.door]);
  mesh.position.set(side < 0 ? 0 : -LEAF_W, 0, -0.07); pivot.add(mesh);
  ornateHandle(pivot, side < 0 ? LEAF_W - 0.2 : -(LEAF_W - 0.2));
  return pivot;
}
const doorL = makeDoor(-1), doorR = makeDoor(1);
const seam = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 8.5), new THREE.MeshBasicMaterial({ color: hdr([3, 2.8, 2.6]), transparent: true, fog: false }));
seam.position.set(0, 4.25, WALL_Z + 0.12); scene.add(seam);
// outside: soft dark-ish vestibule floor area is the same floor; a blush backdrop behind the camera is the fog colour

// ---------- back: staircase, giant window, curtains ----------
for (let i = 0; i < 14; i++) box(10, 0.18, 0.42, M.col, 0, 0.09 + i * 0.18, HALL_END + 8 - i * 0.42);
const landingZ = HALL_END + 8 - 14 * 0.42;
box(14, 2.6, HALL_END + 8 - 14 * 0.42 - HALL_END + 2, M.col, 0, 1.3, (landingZ + HALL_END) / 2 - 1).visible = true;
box(2 * HALL_W, 22, 0.4, M.wall, 0, 11, HALL_END);
const bigWin = new THREE.Mesh(new THREE.ShapeGeometry(archShape(7.6, 11.5), 40), M.win); bigWin.position.set(0, 2.6, HALL_END + 0.25); world.add(bigWin);
const mull = new THREE.MeshStandardMaterial({ color: '#f8efe9', roughness: 0.5 });
for (const x of [-1.9, 0, 1.9]) box(0.1, 9, 0.1, mull, x, 2.6 + 4.5, HALL_END + 0.3);
for (const y of [5.4, 8.6]) box(7.6, 0.1, 0.1, mull, 0, y, HALL_END + 0.3);
const winArc = new THREE.Mesh(new THREE.TorusGeometry(3.8, 0.12, 8, 40, Math.PI), M.gold); winArc.position.set(0, 2.6 + 11.5 - 3.8, HALL_END + 0.32); world.add(winArc);
function curtain(x, flip) {
  const g = new THREE.PlaneGeometry(3.2, 12.5, 60, 40); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const px = p.getX(i), py = p.getY(i); const tie = Math.exp(-Math.pow((py + 1.2) / 2.2, 2)); const gather = 1 - 0.55 * tie * ((px * flip + 1.6) / 3.2); p.setX(i, (px * flip + 1.6) * gather * flip - 1.6 * flip); p.setZ(i, Math.sin(px * 5.5 + py * 0.15) * 0.18 * (1 - 0.4 * tie)); }
  g.computeVertexNormals(); const m = new THREE.Mesh(g, M.curtain); m.position.set(x, 2.6 + 6.25, HALL_END + 0.9); world.add(m);
}
curtain(-5.3, -1); curtain(5.3, 1);
// window glow + light shafts
const winGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#fff3ec', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.9, fog: false }));
winGlow.scale.set(22, 26, 1); winGlow.position.set(0, 8, HALL_END + 2); scene.add(winGlow);
function shaftTexture() { const cv = document.createElement('canvas'); cv.width = 64; cv.height = 256; const g = cv.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(255,248,240,.9)'); gr.addColorStop(1, 'rgba(255,248,240,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 256); const gx = g.createLinearGradient(0, 0, 64, 0); gx.addColorStop(0, 'rgba(0,0,0,1)'); gx.addColorStop(0.5, 'rgba(0,0,0,0)'); gx.addColorStop(1, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = gx; g.fillRect(0, 0, 64, 256); return new THREE.CanvasTexture(cv); }
const shaftMat = new THREE.MeshBasicMaterial({ map: shaftTexture(), transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
const shafts = [];
for (let z = -8.5; z > HALL_END + 4; z -= 7) for (const s of [-1, 1]) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 12), shaftMat); m.position.set(s * (HALL_W - 3.6), 4.2, z + 0.6); m.rotation.set(0, s * Math.PI / 2, s * 0.62); scene.add(m); shafts.push(m);
}

// ---------- blossom branches under the vault ----------
const blossoms = [];
for (let z = -3; z > HALL_END + 4; z -= 7) for (const s of [-1, 1]) {
  const pts = [new THREE.Vector3(s * (HALL_W - 0.3), 10.6, z), new THREE.Vector3(s * (HALL_W - 1.8), 9.4, z - 1.2), new THREE.Vector3(s * (HALL_W - 2.6), 8.0, z - 0.4), new THREE.Vector3(s * (HALL_W - 3.0), 7.1, z + 0.8)];
  const curve = new THREE.CatmullRomCurve3(pts);
  world.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.05, 6), M.branch));
  for (let i = 0; i < 170; i++) { const p = curve.getPoint(Math.pow(R(), 0.8)); blossoms.push([p.x + (R() - 0.5) * 1.3, p.y + (R() - 0.6) * 1.0, p.z + (R() - 0.5) * 1.3, 0.06 + R() * 0.07, pick(P.blossom)]); }
}
const B0 = blossoms.length;
// over the doorway (seen from outside)
for (let i = 0; i < 700; i++) { const s = R() < 0.5 ? -1 : 1; const x = s * (2.6 + R() * 5.5), y = 9 + R() * 4.5 - Math.abs(x) * 0.25, z = WALL_Z + 0.3 + R() * 1.6; blossoms.push([x, y, z, 0.07 + R() * 0.08, pick(P.blossom)]); }
const blossomsMesh = instanced(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6 }), blossoms.length, (i, d, c) => { const b = blossoms[i]; d.position.set(b[0], b[1], b[2]); d.scale.setScalar(b[3]); c.set(b[4]); });


// ---------- wedding-hall dressing (cfg.wedding): guest chairs, aisle petals + candles, flower arch on a stage ----------
if (cfg.wedding) {
  const seat = new THREE.BoxGeometry(0.5, 0.07, 0.5); seat.translate(0, 0.5, 0);
  const back = new THREE.BoxGeometry(0.5, 0.78, 0.06); back.translate(0, 0.93, 0.22);   // guests face the arch (-z), back toward +z
  const legs = [[-0.21, -0.21], [0.21, -0.21], [-0.21, 0.21], [0.21, 0.21]].map(([x, z]) => { const g = new THREE.BoxGeometry(0.05, 0.5, 0.05); g.translate(x, 0.25, z); return g; });
  const chairGeo = mergeGeometries([seat, back, ...legs]);
  const chairMat = new THREE.MeshStandardMaterial({ color: '#fffafa', roughness: 0.35, metalness: 0.05 });
  const chairs = [];
  for (let z = -7; z > -43; z -= 1.15) for (const s of [-1, 1]) for (const x of [1.6, 2.35]) chairs.push([s * x, z]);
  instanced(chairGeo, chairMat, chairs.length, (i, d, c) => { d.position.set(chairs[i][0], 0, chairs[i][1]); c.set('#ffffff'); });
  instanced(new THREE.IcosahedronGeometry(1, 1), M.rose, chairs.length, (i, d, c) => { d.position.set(chairs[i][0], 1.18, chairs[i][1] + 0.27); d.scale.set(0.09, 0.07, 0.05); c.set(P.roses[i % 3]); });

  // petals strewn on the aisle
  const flatPetal = new THREE.Shape(); flatPetal.moveTo(0, -0.5); flatPetal.bezierCurveTo(0.55, -0.2, 0.45, 0.45, 0, 0.5); flatPetal.bezierCurveTo(-0.45, 0.45, -0.55, -0.2, 0, -0.5);
  const flat = new THREE.ShapeGeometry(flatPetal, 6); flat.rotateX(-Math.PI / 2);
  const fp = []; for (let i = 0; i < 620; i++) fp.push([(R() - 0.5) * 2.3, 0.012 + R() * 0.012, -1.5 - R() * 44, R() * 6.28, 0.09 + R() * 0.09, pick(P.blossom)]);
  instanced(flat, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.7, side: THREE.DoubleSide }), fp.length, (i, d, c) => { const p = fp[i]; d.position.set(p[0], p[1], p[2]); d.rotation.y = p[3]; d.scale.setScalar(p[4]); c.set(p[5]); });

  // candle jars lining the aisle
  const jarGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.34, 14);
  const jars = []; for (let z = -4; z > -45; z -= 1.15) for (const s of [-1, 1]) jars.push([s * 1.18, z]);
  instanced(jarGeo, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.1, transparent: true, opacity: 0.6 }), jars.length, (i, d, c) => { d.position.set(jars[i][0], 0.17, jars[i][1]); c.set('#ffffff'); });
  for (const [x, z] of jars) {
    const fl = new THREE.Mesh(flameGeo, M.glow); fl.scale.set(1, 1.5, 1); fl.position.set(x, 0.3, z); world.add(fl);
    const sp = new THREE.Sprite(glowMat); sp.scale.set(0.9, 0.9, 1); sp.position.set(x, 0.32, z); world.add(sp);
  }

  // ceremony stage + moon-gate flower arch
  const AZ = -46, AR = 2.8, AY = 3.3;
  box(9.5, 0.3, 5.5, M.col, 0, 0.15, AZ - 0.6);
  box(9.9, 0.1, 5.9, M.gold, 0, 0.32, AZ - 0.6);
  const dr = new THREE.PlaneGeometry(11, 10, 40, 20); { const p = dr.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 3.2) * 0.22); dr.computeVertexNormals(); }
  const drape = new THREE.Mesh(dr, M.curtain); drape.position.set(0, 5.3, AZ - 3.1); world.add(drape);
  const aGlow = new THREE.Sprite(glowMat); aGlow.scale.set(11, 11, 1); aGlow.position.set(0, AY, AZ - 2.4); world.add(aGlow);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(AR, 0.09, 10, 96), new THREE.MeshStandardMaterial({ color: '#fffafa', roughness: 0.4 })); ring.position.set(0, AY, AZ); world.add(ring);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(AR + 0.28, 0.025, 8, 96), M.gold); ring2.position.set(0, AY, AZ); world.add(ring2);
  const ar = [], al = [];
  for (let i = 0; i < 520; i++) {
    const a = R() * Math.PI * 2, w = 0.5 + 0.5 * Math.sin(a + 0.6);        // heavier on one sweep like a real floral arch
    if (R() > w * 0.95 + 0.12) continue;
    const r = AR + (R() - 0.5) * 0.5, sc = 0.13 + R() * 0.1 + w * 0.06;
    ar.push([Math.cos(a) * r, AY + Math.sin(a) * r, AZ + (R() - 0.5) * 0.5, sc, pick(P.roses)]);
    if (R() < 0.5) al.push([Math.cos(a) * r + (R() - 0.5) * 0.4, AY + Math.sin(a) * r + (R() - 0.5) * 0.4, AZ, R() * 6]);
  }
  for (const s of [-1, 1]) {            // flower pedestals either side of the stage
    const x = s * 4.2; box(0.9, 0.9, 0.9, M.col, x, 0.77, AZ + 0.6); const urn = new THREE.Mesh(urnGeo, M.col); urn.position.set(x, 1.22, AZ + 0.6); world.add(urn);
    roseDome(x, 2.75, AZ + 0.6, 1.0, 130, ar, al);
  }
  instanced(roseGeo, M.rose, ar.length, (i, d, c) => { const r = ar[i]; d.position.set(r[0], r[1], r[2]); d.scale.setScalar(r[3]); d.rotation.set(R() * 6, R() * 6, R() * 6); c.set(r[4]); });
  instanced(leafGeo, M.leaf, al.length, (i, d, c) => { const l = al[i]; d.position.set(l[0], l[1], l[2]); d.scale.set(0.17, 0.035, 0.07); d.rotation.set(R() * 0.6, l[3], R() * 0.8 - 0.4); c.set(P.leaf); });
}


// ---------- detailed entrance (replaces the plain one; uses R2 only) ----------
{
  for (let i = ENT0; i < ENT1; i++) world.children[i].visible = false;            // old flat wall, frame, lanterns
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let i = G0; i < G1; i++) rosesMesh.setMatrixAt(i, zero); rosesMesh.instanceMatrix.needsUpdate = true;   // old garland
  for (let i = LG0; i < LG1; i++) leavesMesh.setMatrixAt(i, zero); leavesMesh.instanceMatrix.needsUpdate = true;
  for (let i = B0; i < blossoms.length; i++) blossomsMesh.setMatrixAt(i, zero); blossomsMesh.instanceMatrix.needsUpdate = true;  // floating balls

  // carved marble wall with an arched opening that matches the door leaves
  function wallTexture() {
    const cv = document.createElement('canvas'); cv.width = cv.height = 1024; const g = cv.getContext('2d');
    g.fillStyle = '#f3e1dc'; g.fillRect(0, 0, 1024, 1024);
    g.filter = 'blur(1px)';
    for (let i = 0; i < 20; i++) { g.strokeStyle = `rgba(190,150,150,${0.05 + R2() * 0.08})`; g.lineWidth = 0.6 + R2() * 1.6; g.beginPath(); let x = R2() * 1024, y = R2() * 1024; g.moveTo(x, y); for (let k = 0; k < 5; k++) { const nx = x + (R2() - 0.4) * 240, ny = y + (R2() - 0.5) * 240; g.quadraticCurveTo((x + nx) / 2, (y + ny) / 2 + (R2() - 0.5) * 60, nx, ny); x = nx; y = ny; } g.stroke(); }
    g.filter = 'none'; g.strokeStyle = 'rgba(175,140,135,.35)'; g.lineWidth = 3;
    for (let r = 0; r < 4; r++) { g.beginPath(); g.moveTo(0, r * 256); g.lineTo(1024, r * 256); g.stroke(); for (let c = 0; c < 3; c++) { const x = ((c + (r % 2) * 0.5) * 1024 / 2.5) % 1024; g.beginPath(); g.moveTo(x, r * 256); g.lineTo(x, r * 256 + 256); g.stroke(); } }
    const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(0.4, 0.4); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  const wallMat = new THREE.MeshStandardMaterial({ map: wallTexture(), roughness: 0.55 });
  const outline = (rx, ry, w) => { const s = new THREE.Path(); s.moveTo(-w, 0); s.lineTo(-w, LEAF_SIDE); s.absellipse(0, LEAF_SIDE, rx, ry, Math.PI, 0, true); s.lineTo(w, 0); s.lineTo(-w, 0); return s; };
  const wshape = new THREE.Shape(); wshape.moveTo(-HALL_W, 0); wshape.lineTo(HALL_W, 0); wshape.lineTo(HALL_W, 22); wshape.lineTo(-HALL_W, 22); wshape.lineTo(-HALL_W, 0);
  wshape.holes.push(outline(LEAF_W, LEAF_TOP - LEAF_SIDE, LEAF_W));
  const wall = new THREE.Mesh(new THREE.ExtrudeGeometry(wshape, { depth: 0.7, bevelEnabled: false, curveSegments: 48 }), wallMat); wall.position.z = WALL_Z - 0.7; world.add(wall);
  // archivolt: raised moulded band round the opening + gold lines + gold beads + keystone
  const band = new THREE.Shape(); band.moveTo(-2.78, 0); band.lineTo(-2.78, LEAF_SIDE); band.absellipse(0, LEAF_SIDE, 2.78, 1.98, Math.PI, 0, true); band.lineTo(2.78, 0); band.lineTo(2.3, 0);
  band.lineTo(2.3, LEAF_SIDE); band.absellipse(0, LEAF_SIDE, 2.3, 1.5, 0, Math.PI, false); band.lineTo(-2.3, 0); band.lineTo(-2.78, 0);
  const bandMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(band, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3, curveSegments: 64 }), M.col); bandMesh.position.z = WALL_Z; world.add(bandMesh);
  const contour = (rx, ry, n = 120) => { const pts = []; for (let i = 0; i <= 30; i++) pts.push(new THREE.Vector3(-rx, i / 30 * LEAF_SIDE, 0)); for (let i = 1; i < n; i++) { const a = Math.PI - i / n * Math.PI; pts.push(new THREE.Vector3(Math.cos(a) * rx, LEAF_SIDE + Math.sin(a) * ry, 0)); } for (let i = 30; i >= 0; i--) pts.push(new THREE.Vector3(rx, i / 30 * LEAF_SIDE, 0)); return pts; };
  for (const [rx, ry, z, r] of [[2.36, 1.56, 0.29, 0.03], [2.72, 1.92, 0.29, 0.03]]) { const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(contour(rx, ry)), 400, r, 8), M.gold); tube.position.z = WALL_Z + z; world.add(tube); }
  const beadPts = contour(2.54, 1.74, 90).filter((_, i) => i % 3 === 0);
  instanced(new THREE.SphereGeometry(0.042, 10, 8), M.gold, beadPts.length, (i, d, c) => { d.position.set(beadPts[i].x, beadPts[i].y, WALL_Z + 0.31); c.set('#ffffff'); });
  const key = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.95, 0.42), M.col); key.position.set(0, LEAF_SIDE + 1.85, WALL_Z + 0.16); world.add(key);
  const kG = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.035, 10, 28), M.gold); kG.position.set(0, LEAF_SIDE + 1.9, WALL_Z + 0.39); world.add(kG);
  const kS = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 10), M.gold); kS.position.set(0, LEAF_SIDE + 1.9, WALL_Z + 0.4); world.add(kS);
  for (const sd of [-1, 1]) { const sc = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.025, 8, 20, Math.PI * 1.5), M.gold); sc.position.set(sd * 0.2, LEAF_SIDE + 1.55, WALL_Z + 0.39); sc.rotation.z = sd > 0 ? 0 : Math.PI / 2; world.add(sc); }
  // fluted pilasters, capitals, entablature and cornice
  function fluteTexture() { const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64; const g = cv.getContext('2d'); g.fillStyle = '#fbf2ec'; g.fillRect(0, 0, 256, 64);
    for (let k = 0; k < 6; k++) { const x = 18 + k * 40, gr = g.createLinearGradient(x - 12, 0, x + 12, 0); gr.addColorStop(0, 'rgba(160,120,115,0)'); gr.addColorStop(0.35, 'rgba(160,120,115,.45)'); gr.addColorStop(0.65, 'rgba(255,255,255,.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x - 12, 0, 24, 64); }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; }
  const pilMat = new THREE.MeshStandardMaterial({ map: fluteTexture(), roughness: 0.45 });
  for (const sd of [-1, 1]) {
    const x = sd * 3.45;
    box(0.72, 9.0, 0.32, [M.col, M.col, M.col, M.col, pilMat, M.col], x, 0.45 + 4.5, WALL_Z + 0.16);
    box(0.98, 0.45, 0.48, M.col, x, 0.225, WALL_Z + 0.24); box(1.02, 0.06, 0.5, M.gold, x, 0.47, WALL_Z + 0.24);
    box(0.98, 0.34, 0.48, M.col, x, 9.62, WALL_Z + 0.24); box(1.02, 0.05, 0.5, M.gold, x, 9.43, WALL_Z + 0.24);
    for (const dx of [-0.26, 0.26]) { const v = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.03, 8, 20, Math.PI * 1.6), M.gold); v.position.set(x + dx, 9.66, WALL_Z + 0.5); v.rotation.z = dx < 0 ? -0.4 : Math.PI + 0.4; world.add(v); }
  }
  box(8.4, 0.62, 0.55, M.col, 0, 10.12, WALL_Z + 0.26); box(8.4, 0.05, 0.02, M.gold, 0, 9.88, WALL_Z + 0.55); box(8.4, 0.05, 0.02, M.gold, 0, 10.36, WALL_Z + 0.55);
  box(9.0, 0.26, 0.75, M.col, 0, 10.56, WALL_Z + 0.36); box(9.0, 0.04, 0.02, M.gold, 0, 10.44, WALL_Z + 0.74);
  // ornate lanterns on curled gold brackets
  for (const sd of [-1, 1]) {
    const lx = sd * 4.3, ly = 4.75, lz = WALL_Z + 0.62;
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.56, 8), M.glow); glass.position.set(lx, ly, lz); world.add(glass);
    const cage = new THREE.Mesh(new THREE.CylinderGeometry(0.215, 0.175, 0.58, 8, 1, true), new THREE.MeshStandardMaterial({ color: P.gold, metalness: 1, roughness: 0.3, wireframe: true })); cage.position.set(lx, ly, lz); world.add(cage);
    for (const [y, r] of [[0.29, 0.215], [-0.29, 0.175]]) { const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.025, 8, 24), M.gold); t.rotation.x = Math.PI / 2; t.position.set(lx, ly + y, lz); world.add(t); }
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.32, 8), M.gold); cap.position.set(lx, ly + 0.45, lz); world.add(cap);
    const fin = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), M.gold); fin.position.set(lx, ly + 0.66, lz); world.add(fin);
    const bot = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.24, 8), M.gold); bot.rotation.x = Math.PI; bot.position.set(lx, ly - 0.41, lz); world.add(bot);
    const arm = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.028, 8, 30, Math.PI), M.gold); arm.rotation.y = Math.PI / 2; arm.position.set(lx, ly + 0.66, lz - 0.32); world.add(arm);
    const sp = new THREE.Sprite(glowMat); sp.scale.set(2.4, 2.4, 1); sp.position.set(lx, ly, lz + 0.2); world.add(sp);
  }
  // marble threshold steps
  box(6.4, 0.12, 0.9, M.col, 0, 0.06, WALL_Z + 0.45); box(6.4, 0.03, 0.02, M.gold, 0, 0.11, WALL_Z + 0.9);
  box(7.0, 0.06, 1.5, M.col, 0, 0.03, WALL_Z + 0.75);

  // ---- flowers: rose garland hugging the archivolt, trailing greenery, cherry-blossom branches ----
  const gR = [], gL = [], gB = [];
  const along = (u) => { const side = LEAF_SIDE - 0.6, arcL = Math.PI * 3.0, tot = side * 2 + arcL, d = u * tot, rx = 3.0, ry = 2.2;
    if (d < side) return [-rx, 0.6 + d]; if (d < side + arcL) { const a = Math.PI - (d - side) / arcL * Math.PI; return [Math.cos(a) * rx, LEAF_SIDE + Math.sin(a) * ry]; } return [rx, LEAF_SIDE - (d - side - arcL)]; };
  const dens = (u) => 0.3 + 0.9 * Math.exp(-Math.pow((u - 0.33) / 0.1, 2)) + 0.9 * Math.exp(-Math.pow((u - 0.62) / 0.09, 2)) + 0.5 * Math.exp(-Math.pow(u / 0.08, 2)) + 0.5 * Math.exp(-Math.pow((u - 1) / 0.08, 2));
  for (let i = 0; i < 2600; i++) {
    const u = R2(); if (R2() * 1.6 > dens(u)) continue;
    const [x, y] = along(u), th = R2() * Math.PI * 2, rr = Math.sqrt(R2()) * 0.42 * Math.min(1.4, dens(u));
    const px = x + Math.cos(th) * rr, py = y + Math.sin(th) * rr, pz = WALL_Z + 0.42 + R2() * 0.35;
    const k = R2();
    if (k < 0.5) gR.push([px, py, pz, 0.1 + R2() * 0.1 * Math.min(1.3, dens(u)), pick2(P.roses)]);
    else if (k < 0.8) gL.push([px, py, pz - 0.05, R2() * 6, R2() * 6]);
    else gB.push([px, py, pz + 0.05, 0.05 + R2() * 0.05, R2() < 0.6 ? '#ffffff' : pick2(P.blossom)]);
  }
  // trailing vines falling from the two lush clusters
  for (const u0 of [0.33, 0.62, 0.05, 0.95]) for (let v = 0; v < 5; v++) {
    let [x, y] = along(u0 + (R2() - 0.5) * 0.06); const len = 1.2 + R2() * 2.2, sx = (R2() - 0.5) * 0.25;
    for (let s2 = 0; s2 < len; s2 += 0.1) { gL.push([x + sx * s2 + Math.sin(s2 * 5 + v) * 0.08, y - s2, WALL_Z + 0.5 + R2() * 0.1, R2() * 6, R2() * 6]); if (R2() < 0.12) gB.push([x + sx * s2, y - s2, WALL_Z + 0.56, 0.04 + R2() * 0.03, '#ffffff']); }
  }
  function pick2(a) { return a[Math.floor(R2() * a.length)]; }
  instanced(roseGeo, M.rose, gR.length, (i, d, c) => { const r = gR[i]; d.position.set(r[0], r[1], r[2]); d.scale.setScalar(r[3]); d.rotation.set(R2() * 6, R2() * 6, R2() * 6); c.set(r[4]); });
  instanced(leafGeo, M.leaf, gL.length, (i, d, c) => { const l = gL[i]; d.position.set(l[0], l[1], l[2]); d.scale.set(0.15, 0.03, 0.065); d.rotation.set(l[3] * 0.3, l[3], l[4] * 0.3); c.set(P.leaf).offsetHSL(0, 0, (R2() - 0.5) * 0.12); });
  const flowerShape = new THREE.Shape(); for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2, b = (k + 0.5) / 5 * Math.PI * 2; const px = Math.cos(a), py = Math.sin(a); if (!k) flowerShape.moveTo(0, 0); flowerShape.quadraticCurveTo(Math.cos(a - 0.5) * 1.25, Math.sin(a - 0.5) * 1.25, px, py); flowerShape.quadraticCurveTo(Math.cos(a + 0.5) * 1.25, Math.sin(a + 0.5) * 1.25, 0, 0); }
  const flowerGeo = new THREE.ShapeGeometry(flowerShape, 4);
  const flowerMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.65, side: THREE.DoubleSide, emissive: '#f6d3d8', emissiveIntensity: 0.15 });
  // cherry-blossom branches reaching over the top corners
  const bl = [];
  for (const sd of [-1, 1]) for (let b = 0; b < 3; b++) {
    const y0 = 13.2 - b * 1.1, pts = [new THREE.Vector3(sd * 9.0, y0, WALL_Z + 0.9 + b * 0.2), new THREE.Vector3(sd * (6.6 - b * 0.4), y0 - 0.6 - R2() * 0.4, WALL_Z + 1.0), new THREE.Vector3(sd * (4.6 - b * 0.6), y0 - 1.2 + R2() * 0.3, WALL_Z + 0.95), new THREE.Vector3(sd * (2.6 - b * 0.4), y0 - 2.0 - R2() * 0.5, WALL_Z + 1.05)];
    const curve = new THREE.CatmullRomCurve3(pts);
    world.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.055 - b * 0.01, 6), M.branch));
    for (let i = 0; i < 950; i++) { const t2 = Math.pow(R2(), 0.75), p = curve.getPoint(t2), spread = 0.35 + t2 * 0.7; bl.push([p.x + (R2() - 0.5) * spread * 2, p.y + (R2() - 0.55) * spread * 1.5, p.z + (R2() - 0.5) * 0.5, 0.06 + R2() * 0.06, pick2(P.blossom)]); }
  }
  instanced(flowerGeo, flowerMat, gB.length + bl.length, (i, d, c) => { const f = i < gB.length ? gB[i] : bl[i - gB.length]; d.position.set(f[0], f[1], f[2]); d.scale.setScalar(f[3]); d.rotation.set((R2() - 0.5) * 1.2, (R2() - 0.5) * 1.2, R2() * 6); c.set(f[4]); });
}

// ---------- mirror world (reflection in the marble floor) ----------
const mirror = world.clone(); mirror.scale.y = -1; scene.add(mirror);
const mirrorDoorL = mirror.children[world.children.indexOf(doorL)], mirrorDoorR = mirror.children[world.children.indexOf(doorR)];
const mirrorCh = chandeliers.map((c) => mirror.children[world.children.indexOf(c)]);

// ---------- petals ----------
const petalShape = new THREE.Shape(); petalShape.moveTo(0, -0.5); petalShape.bezierCurveTo(0.55, -0.2, 0.45, 0.45, 0, 0.5); petalShape.bezierCurveTo(-0.45, 0.45, -0.55, -0.2, 0, -0.5);
const NP = 260, petalSeeds = [];
for (let i = 0; i < NP; i++) petalSeeds.push({ x: (R() - 0.5) * 12, z: 4 - R() * 46, y0: R() * 11, v: 0.35 + R() * 0.35, w: 0.6 + R() * 1.4, ph: R() * 6.28, s: 0.07 + R() * 0.07, c: pick(P.blossom) });
const petals = instanced(new THREE.ShapeGeometry(petalShape, 6), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.7, side: THREE.DoubleSide, emissive: '#f7cfd4', emissiveIntensity: 0.25 }), NP, (i, d, c) => { c.set(petalSeeds[i].c); d.scale.setScalar(0); }, scene);

// ---------- outro extras (only visible after cfg.outroAt seconds) ----------
const OUTRO = cfg.outroAt ?? 44.6;
const NB = 220, burstSeeds = [];
for (let i = 0; i < NB; i++) burstSeeds.push({ x: (R() - 0.5) * 7, zo: -2 - R() * 9, y0: 6 + R() * 6, v: 0.55 + R() * 0.5, w: 0.6 + R() * 1.4, ph: R() * 6.28, s: 0.08 + R() * 0.08, c: pick(P.blossom), d: R() * 1.6 });
const burst = instanced(new THREE.ShapeGeometry(petalShape, 6), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.7, side: THREE.DoubleSide, emissive: '#f7cfd4', emissiveIntensity: 0.3 }), NB, (i, d, c) => { c.set(burstSeeds[i].c); d.scale.setScalar(0); }, scene);
const winGlow0 = { o: winGlow.material.opacity, sx: winGlow.scale.x, sy: winGlow.scale.y };

// ---------- outro flower arch: a moon-gate ring that blooms from 40 s (invisible before) ----------
const ARCH = { at: cfg.archAt ?? 40.3, dur: 3.9, z: cfg.archZ ?? -33, r: 2.5 };
ARCH.y = ARCH.r + 0.62;
const archItems = [];     // [x, y, z, scale, colour, bloomOrder, geo]  geo: 0 rose, 1 leaf, 2 blossom
for (let i = 0; i < 560; i++) {
  const a = R() * Math.PI * 2;
  const fromBottom = Math.abs(Math.atan2(Math.cos(a), -Math.sin(a))) / Math.PI;  // 0 at bottom, 1 at top
  const heavy = 0.55 + 0.45 * Math.sin(a + 2.4);                                    // fuller on one sweep, like a real arch
  if (R() > heavy * 0.9 + 0.2) continue;
  const rr = ARCH.r + (R() - 0.5) * 0.55, z = ARCH.z + (R() - 0.5) * 0.55;
  const order = fromBottom * 0.92 + R() * 0.08;
  archItems.push([Math.cos(a) * rr, ARCH.y + Math.sin(a) * rr, z, 0.12 + R() * 0.09 + heavy * 0.05, pick(P.roses), order, 0]);
  if (R() < 0.55) archItems.push([Math.cos(a) * (rr + (R() - 0.5) * 0.5), ARCH.y + Math.sin(a) * (rr + (R() - 0.5) * 0.5), z + (R() - 0.5) * 0.3, R() * 6, P.leaf, order, 1]);
  if (R() < 0.6) archItems.push([Math.cos(a) * (rr + (R() - 0.5) * 0.7), ARCH.y + Math.sin(a) * (rr + (R() - 0.5) * 0.7), z + (R() - 0.5) * 0.4, 0.05 + R() * 0.04, pick(P.blossom), order, 2]);
}
for (let i = 0; i < 140; i++) {        // flower mound the ring stands on
  const th = R() * Math.PI, ph = R() * Math.PI, r = 0.9 * (0.8 + R() * 0.3);
  archItems.push([Math.cos(th) * r * 1.4, 0.15 + Math.sin(ph) * r * 0.55, ARCH.z + Math.cos(ph) * r * 0.6, 0.13 + R() * 0.08, pick(P.roses), R() * 0.12, 0]);
}
const archRose = archItems.filter((x) => x[6] === 0), archLeaf = archItems.filter((x) => x[6] === 1), archBlos = archItems.filter((x) => x[6] === 2);
const blossomGeo = new THREE.IcosahedronGeometry(1, 1), blossomMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6 });
function archMesh(list, geo, mat, mirrorY) {
  return instanced(geo, mat, list.length, (i, d, c) => { c.set(list[i][4]); d.scale.setScalar(0); }, scene);
}
const archSets = [[archRose, roseGeo, M.rose], [archLeaf, leafGeo, M.leaf], [archBlos, blossomGeo, blossomMat]].map(([list, geo, mat]) => ({ list, rot: list.map(() => [R() * 6, R() * 6, R() * 6]), mesh: archMesh(list, geo, mat), mir: archMesh(list, geo, mat) }));
const archRing = new THREE.Mesh(new THREE.TorusGeometry(ARCH.r, 0.07, 10, 120), new THREE.MeshStandardMaterial({ color: '#fffafa', roughness: 0.4 }));
const archGold = new THREE.Mesh(new THREE.TorusGeometry(ARCH.r + 0.2, 0.025, 8, 120), M.gold);
for (const m of [archRing, archGold]) { m.position.set(0, ARCH.y, ARCH.z); m.scale.setScalar(0); scene.add(m); }
const archRingM = archRing.clone(), archGoldM = archGold.clone();
for (const m of [archRingM, archGoldM]) { m.position.y = -ARCH.y; scene.add(m); }
const archHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#fff3ee', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0, fog: false }));
archHalo.position.set(0, ARCH.y, ARCH.z - 0.8); archHalo.scale.set(7, 7, 1); scene.add(archHalo);
const easeOutBack = (k) => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
function updateArch(t) {
  const on = t > ARCH.at;
  const rk = on ? smooth(clamp01((t - ARCH.at) / 0.9)) : 0;
  archRing.scale.setScalar(rk); archGold.scale.setScalar(rk);
  archRingM.scale.set(rk, -rk, rk); archGoldM.scale.set(rk, -rk, rk);
  archHalo.material.opacity = on ? 0.14 * smooth(clamp01((t - ARCH.at - 2) / 2.5)) : 0;
  for (const S of archSets) {
    for (let i = 0; i < S.list.length; i++) {
      const it = S.list[i], k = on ? clamp01((t - ARCH.at - it[5] * ARCH.dur) / 0.7) : 0;
      const sc = k > 0 ? (it[6] === 1 ? 1 : it[3]) * easeOutBack(k) : 0;
      dummy.position.set(it[0], it[1], it[2]);
      if (it[6] === 1) { dummy.rotation.set(0.3, it[3], 0.2); dummy.scale.set(0.17 * sc, 0.035 * sc, 0.07 * sc); }
      else { dummy.rotation.set(S.rot[i][0], S.rot[i][1] + t * 0.05, S.rot[i][2]); dummy.scale.setScalar(sc); }
      dummy.updateMatrix(); S.mesh.setMatrixAt(i, dummy.matrix);
      dummy.position.y = -it[1]; dummy.scale.y = -dummy.scale.y; dummy.updateMatrix(); S.mir.setMatrixAt(i, dummy.matrix);
    }
    S.mesh.instanceMatrix.needsUpdate = true; S.mir.instanceMatrix.needsUpdate = true;
  }
}

// ---------- post ----------
const composer = new EffectComposer(renderer);
composer.setSize(cfg.width, cfg.height);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(cfg.width, cfg.height), 0.3, 0.5, 1.0));
composer.addPass(new OutputPass());

// ---------- timeline ----------
const camZ = track([[0, 14.5], [1.4, 14.0], [3.0, 12.4], [5.4, 4.0], [7.8, -5.0], [10.4, -9.6], [24, -15], [40, -21]]);
const camY = track([[0, 3.2], [3.0, 3.1], [6, 2.7], [10, 2.7], [40, 2.85]]);
const lookY = track([[0, 5.6], [3, 5.4], [6, 4.2], [12, 4.0], [40, 4.1]]);
const dummy = new THREE.Object3D();

window.render3d = function (t) {
  // doors: open outward between 1.3s and 3.9s
  const k = smooth(clamp01((t - 1.3) / 2.6));
  const ang = k * THREE.MathUtils.degToRad(102);
  doorL.rotation.y = -ang; doorR.rotation.y = ang;
  mirrorDoorL.rotation.y = -ang; mirrorDoorR.rotation.y = ang;
  seam.material.opacity = 1 - smooth(clamp01((t - 1.3) / 0.8));
  seam.visible = seam.material.opacity > 0.01;

  // camera
  const kc = smooth(clamp01((t - 40) / 5));           // 0 up to 40 s: frames before are unchanged
  let z = camZ(t);
  if (t > 40) {                                              // Hermite from the 40 s state to a gentle stop in front of the arch
    const T = Math.min(t - 40, 10) / 10, v0 = -0.375 * 10, z1 = ARCH.z + (cfg.archDist ?? 9.4), v1 = -0.06 * 10;
    const h00 = 2 * T ** 3 - 3 * T ** 2 + 1, h10 = T ** 3 - 2 * T ** 2 + T, h01 = -2 * T ** 3 + 3 * T ** 2, h11 = T ** 3 - T ** 2;
    z = h00 * -21 + h10 * v0 + h01 * z1 + h11 * v1;
  }
  const y = camY(t), sway = smooth(clamp01((t - 8) / 4)) * (1 - kc);
  camera.position.set(Math.sin(t * 0.21) * 0.18 * sway, y, z);
  const lyArch = y + (ARCH.y - y) * 14 / Math.max(1, z - ARCH.z);
  camera.lookAt(Math.sin(t * 0.17) * 0.25 * sway, lerp(lookY(t), lyArch, kc), z - 14);
  updateArch(t);

  // chandeliers turn very slowly, crystals shimmer
  chandeliers.forEach((c, i) => { c.rotation.y = t * 0.05 + i; mirrorCh[i].rotation.y = t * 0.05 + i; });
  M.crystal.emissiveIntensity = 1 + 0.18 * Math.sin(t * 2.3);
  shaftMat.opacity = 0.16 + 0.05 * Math.sin(t * 0.5);

  // petals fall
  for (let i = 0; i < NP; i++) {
    const p = petalSeeds[i]; const span = 11.5;
    const y = ((p.y0 - t * p.v) % span + span) % span;
    dummy.position.set(p.x + Math.sin(t * 0.6 * p.w + p.ph) * 0.6, y, p.z);
    dummy.rotation.set(t * p.w + p.ph, t * 0.7 * p.w, Math.sin(t + p.ph));
    dummy.scale.setScalar(t < 1.6 ? 0 : p.s);   // petals start once the doors move
    dummy.updateMatrix(); petals.setMatrixAt(i, dummy.matrix);
  }
  petals.instanceMatrix.needsUpdate = true;

  // outro: petal burst falls just in front of the camera, window light swells
  const ko = clamp01((t - OUTRO) / 4);
  for (let i = 0; i < NB; i++) {
    const p = burstSeeds[i], tt = t - OUTRO - p.d;
    if (tt <= 0) { dummy.scale.setScalar(0); }
    else {
      dummy.position.set(p.x + Math.sin(t * 0.7 * p.w + p.ph) * 0.5, p.y0 - tt * p.v * 1.4, camera.position.z + p.zo);
      dummy.rotation.set(t * p.w + p.ph, t * 0.8 * p.w, Math.sin(t + p.ph));
      dummy.scale.setScalar(p.s * smooth(clamp01(tt / 0.6)));
    }
    dummy.updateMatrix(); burst.setMatrixAt(i, dummy.matrix);
  }
  burst.instanceMatrix.needsUpdate = true;
  winGlow.material.opacity = winGlow0.o * (1 - 0.55 * smooth(clamp01((t - 40) / 3)));
  winGlow.scale.set(winGlow0.sx, winGlow0.sy, 1);

  composer.render();
};
window.__three = { scene, floor, mirror, world, shafts, chandeliers, M, renderer, composer, camera };
window.__ready = true;

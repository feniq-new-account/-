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
// flower urns beside the door
for (const s of [-1, 1]) { const x = s * (DOOR_W + 2.2); const urn = new THREE.Mesh(urnGeo, M.col); urn.position.set(x, 0, WALL_Z + 1.1); world.add(urn); roseDome(x, 1.52, WALL_Z + 1.1, 0.85, 100, roses, leaves); }

instanced(roseGeo, M.rose, roses.length, (i, d, c) => { const r = roses[i]; d.position.set(r[0], r[1], r[2]); d.scale.setScalar(r[3]); d.rotation.set(R() * 6, R() * 6, R() * 6); c.set(r[4]); });
instanced(leafGeo, M.leaf, leaves.length, (i, d, c) => { const l = leaves[i]; d.position.set(l[0], l[1], l[2]); d.scale.set(0.16, 0.035, 0.07); d.rotation.set(R() * 0.6, l[3], R() * 0.8 - 0.4); c.set(P.leaf).offsetHSL(0, 0, (R() - 0.5) * 0.08); });

// doors
function panelFrame(parent, w, h, x, y, z) {
  const t = 0.05;
  box(w, t, 0.04, M.gold, x, y + h / 2, z, parent); box(w, t, 0.04, M.gold, x, y - h / 2, z, parent);
  box(t, h, 0.04, M.gold, x - w / 2, y, z, parent); box(t, h, 0.04, M.gold, x + w / 2, y, z, parent);
}
function makeDoor(side) {      // side -1 = left (hinge at -DOOR_W), +1 = right
  const pivot = new THREE.Group(); pivot.position.set(side * DOOR_W, 0, WALL_Z + 0.02); world.add(pivot);
  const cx = -side * DOOR_W / 2, z = 0.1;
  box(DOOR_W - 0.02, DOOR_H, 0.16, M.door, cx, DOOR_H / 2, 0, pivot);
  panelFrame(pivot, 1.5, 2.1, cx, 6.0, z); panelFrame(pivot, 1.25, 1.75, cx, 6.0, z);
  panelFrame(pivot, 1.5, 2.8, cx, 3.35, z); panelFrame(pivot, 1.25, 2.45, cx, 3.35, z);
  panelFrame(pivot, 1.5, 1.2, cx, 1.0, z);
  const ro = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.045, 8, 24), M.gold); ro.position.set(cx, 3.35, z); pivot.add(ro);
  const ro2 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), M.gold); ro2.position.set(cx, 3.35, z); pivot.add(ro2);
  const ro3 = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.04, 8, 24), M.gold); ro3.position.set(cx, 6.0, z); pivot.add(ro3);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.4, 12), M.gold); handle.position.set(-side * (DOOR_W - 0.28), 3.6, 0.2); pivot.add(handle);
  for (const hy of [2.95, 4.25]) box(0.05, 0.05, 0.16, M.gold, -side * (DOOR_W - 0.28), hy, 0.13, pivot);
  return pivot;
}
const doorL = makeDoor(-1), doorR = makeDoor(1);
const seam = new THREE.Mesh(new THREE.PlaneGeometry(0.07, DOOR_H), new THREE.MeshBasicMaterial({ color: hdr([3, 2.8, 2.6]), transparent: true, fog: false }));
seam.position.set(0, DOOR_H / 2, WALL_Z + 0.12); scene.add(seam);
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
// over the doorway (seen from outside)
for (let i = 0; i < 700; i++) { const s = R() < 0.5 ? -1 : 1; const x = s * (2.6 + R() * 5.5), y = 9 + R() * 4.5 - Math.abs(x) * 0.25, z = WALL_Z + 0.3 + R() * 1.6; blossoms.push([x, y, z, 0.07 + R() * 0.08, pick(P.blossom)]); }
instanced(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6 }), blossoms.length, (i, d, c) => { const b = blossoms[i]; d.position.set(b[0], b[1], b[2]); d.scale.setScalar(b[3]); c.set(b[4]); });


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

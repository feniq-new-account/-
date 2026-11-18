# Three.js recipes for rendered videos

All snippets come from `invitation-video/templates/assets/palace-3d.js`. Copy from there.

## Setup that works headless
- Chromium flags: `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`
  (`render.mjs` already passes them). WebGL2 then runs on the CPU.
- `new WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true })` and `setPixelRatio(1)`.
  `preserveDrawingBuffer` lets the screenshot see the last frame.
- `ACESFilmicToneMapping`, exposure around 0.8. Set `scene.environment` from `PMREMGenerator.fromScene(new RoomEnvironment())`
  so gold and marble reflect something, then lower `scene.environmentIntensity` (0.5–0.6).
- Postprocessing: `EffectComposer` → `RenderPass` → `UnrealBloomPass(size, 0.3, 0.5, 1.0)` → `OutputPass`.
  The threshold of 1.0 means only HDR emissive colours bloom.

## Determinism
- Seeded RNG (mulberry32) for every random placement.
- `render3d(t)` sets everything from `t`: door angles, camera, chandelier rotation, petal positions.
- Camera: `track([[t, v], ...])` uses Catmull-Rom/Hermite in time. Use one track each for z, y and look-at y.
  Add gentle sway with `sin(t*0.2)`, faded in with `smoothstep`.

## Building blocks
| thing | how |
|---|---|
| hall vault | `CylinderGeometry(r, r, len, 56, 1, true, Math.PI/2, Math.PI)`, rotated x by π/2, `BackSide`. **thetaStart must be π/2** for the upper half; −π/2 gives a trough under the camera that hides the whole floor |
| arches / ribs | `TorusGeometry(r, tube, 10, 40, Math.PI)` (half torus); rotate y π/2 for side arcades |
| columns | cylinder shaft + box base/capital + gold torus rings |
| glowing windows | `ShapeGeometry(archShape(w,h))` with `MeshBasicMaterial({color: new Color(1.5,1.3,1.3)})` |
| marble floor | `CanvasTexture`: base colour, diamond inlay, blurred quadratic veins; `RepeatWrapping` |
| reflections | `mirror = world.clone(); mirror.scale.y = -1`, floor `transparent, opacity ~0.6, roughness 0.2`. Keep animated parts in sync on the mirror copy (doors, chandeliers) |
| roses | `IcosahedronGeometry(1,3)` with vertices pushed out by `1+0.07*sin(5*angle + 9*y)` (swirl) and squashed in y; instanced with per-instance colour |
| flower urns | `LatheGeometry` profile + rose dome (random points on an upper hemisphere) + green leaf ellipsoids |
| chandeliers | gold torus rings + instanced `OctahedronGeometry` crystals with HDR emissive + flame spheres + one `PointLight` + an additive glow sprite |
| candles / lanterns | small emissive mesh + additive `Sprite` with a radial-gradient canvas texture |
| curtains | `PlaneGeometry` with many segments; displace z by `sin(x*5.5)` and gather x near a tie-back height |
| doors | `Group` pivot at the hinge, door box offset by half its width; gold panel frames from 4 thin boxes; opening angle eased with smoothstep. Doors open **toward** the camera: left −θ, right +θ |
| light leak | thin HDR plane in the door seam, faded out as the doors start to move |
| petals / particles | one `InstancedMesh` of a bezier petal `ShapeGeometry`, positions computed from t (wrap with modulo) |
| blossom branches | `TubeGeometry` along a `CatmullRomCurve3` + instanced small icosahedrons around it |

## Pitfalls already hit
- **Washed-out, all-white frame**: too much light plus dense bright fog plus bloom. Start with hemisphere 0.6,
  key light 1.1, fog density 0.011, exposure 0.82, and bloom 0.3 with threshold 1.0, then adjust from stills.
- **Floor shows nothing**: something is in front of it (see the vault note above). Test by hiding the floor. If the frame doesn't change, the floor isn't the problem.
- **Module script never runs**: the page was opened from `file://`. Serve it over HTTP.
- **Global named `top`** in a page script kills the script (it clashes with `window.top`).
- **Portrait framing**: a vertical FOV of 60° gives about 34° horizontally. Stand back far enough that the doors and their garland fit.
- **Speed**: about 2 s per frame at 720x1280 with ~4k instances, bloom and the mirror world.
  Lower the canvas size before cutting detail. Keep the DOM text at full 1080x1920.

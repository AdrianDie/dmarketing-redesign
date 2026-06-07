# 3D Building Hero — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static hero section in `ny-forside/index.html` with a cinematic 3D sequence where a modern office building materializes from a blueprint wireframe while the camera swoops down from a bird's-eye view, then reveals the hero text overlay.

**Architecture:** Vanilla HTML/CSS/JS — no build step. Three.js and GSAP are loaded from CDN via `<script>` tags. A `hero3d.js` module manages the entire Three.js scene lifecycle. A pure-CSS preloader runs immediately (no JS dependency), buying 1.3 seconds for Three.js to finish loading in the background. The existing hero text is hidden initially and revealed by GSAP after the 3D animation lands.

**Tech Stack:** Three.js r165 (CDN), GSAP 3.12 (CDN), vanilla JS ES modules via importmap, existing Schibsted Grotesk + CSS variable design system.

---

## Visual Scene Breakdown

### What the user sees, second by second:

**0.0s – 1.3s · "The Clean Boot" (Preloader)**
Screen is the existing `--paper` color (`#FCFBF7` — warm off-white). Centered on screen: a thin, dark horizontal line (2px) grows from left to right over exactly 1.3 seconds with `power2.inOut` easing. To the right of the line, a small percentage counter (12px, `--ink-faint` color, monospace) ticks from `0%` to `100%`. Below the line: the text `Dietrichs Marketing` in tiny uppercase tracking. It feels like a premium Apple-style boot screen — no spinning circles, no cheesy logo animation. Just precision. When it hits 100%, the entire preloader fades to transparent over 0.4s and vanishes. **Three.js has been loading quietly in the background this whole time.**

**1.3s – 2.3s · "The Blueprint Spawn" (Camera top-down)**
The preloader disappears and immediately the 3D canvas is visible. The camera is directly overhead looking straight down at a flat white studio floor with a very subtle warm-gray grid (`#E7E4D8`). The grid stretches to the horizon and fades. From the center of the grid, the building "grows" upward — each of the 5 modules spawning sequentially, staggered 100ms apart, scaling on the Y-axis from 0 to full height with `power3.out` easing (fast start, soft landing). The building is rendered entirely as **cyan wireframe lines** (`#06b6d4`) — it looks exactly like a digital hologram or an AutoCAD floor plan coming to life in 3D space. The impression from above is architectural precision: you see the footprint, the varying widths, the structural logic.

The building shape (seen from above, then from the side):
- **Podium** (Box 0): A wide, flat base slab — 4.0 × 0.6 × 3.5 units. The parking garage / retail plinth. Anchors the composition.
- **Tower A** (Box 1): The main shaft — 2.0 × 5.0 × 2.2 units, offset slightly left. This is the tallest element, the dominant tower.
- **Tower B** (Box 2): A secondary wing — 1.2 × 3.5 × 2.0 units, offset right. Shorter, narrower. Creates asymmetry and depth.
- **Setback** (Box 3): Upper mechanical floor / step-back — 1.4 × 1.5 × 1.6 units, on top of Tower A. Gives the roofline an interesting silhouette.
- **Crown** (Box 4): Thin rooftop element / parapet — 0.8 × 0.3 × 0.8 units. The finishing detail at the very top.

**2.3s – 3.7s · "The Drop & Solidification" (The cinematic moment)**
This is the wow effect. Two things happen simultaneously:

*Camera movement:* The camera begins a cinematic swoop. It starts at `(0, 18, 2)` — essentially pointing straight down — and travels in a smooth arc to `(-8, 5, 12)`. This final position gives a slightly low-angle isometric view: we're looking up at the building from below-eye-level, slightly to the left and in front. The building looks proud and tall. The easing is `power4.out` — the camera accelerates immediately and then decelerates dramatically, landing with the feeling of a helicopter settling onto a landing pad. The movement takes 1.4 seconds.

*Material transition:* While the camera swoops, the cyan wireframe begins to **dissolve**. The wireframe mesh fades its opacity from 1 → 0 over 0.55 seconds with `power2.in` easing (accelerating fade-out, like smoke clearing). Simultaneously, a second set of solid meshes (same geometry, same position) fades in from opacity 0 → 1 with `power2.out`. The solid material is `MeshStandardMaterial` in `#f8fafc` (barely-white with a cool tint): `roughness: 0.18`, `metalness: 0.05`. With the directional light hitting it, it looks like high-end precast concrete or matte architectural ceramic. The shadows the building casts on the ground plane are soft (PCF soft shadow map with blur radius 4) — the kind of shadow you'd see in a high-end architectural rendering.

The net visual effect: the blueprint becomes real. The digital ghost solidifies into physical material in real time. The camera lands just as the transition completes. The building sits there in its warm studio lighting, casting a single precise shadow.

**3.7s+ · "The Living Still" (Continuous + UI)**
The camera is at rest (gentle drift, near-imperceptible). At exactly 3.7s, the hero text overlay fades in from opacity 0, translating 10px upward simultaneously (`y: 10 → 0, opacity: 0 → 1`, duration 0.65s, `power2.out`). The building continues to exist in the background. Eighty small white/lavender particles (`#c7d2fe`) drift very slowly in the scene — they're `PointsMaterial` dots, essentially invisible close up but adding a sense of living atmosphere at distance.

When the user moves their mouse, the camera shifts very subtly in the opposite direction — the building "looks back" at them. Maximum parallax offset is ±1.2 units on X, ±0.5 on Y. Lerped at 4% per frame, so the motion is smooth and elastic, never jerky.

---

## File Structure

```
ny-forside/
  index.html          MODIFY  — importmap, GSAP CDN, preloader div, canvas wrapper, hero-ui restructure
  style.css           MODIFY  — add hero canvas/preloader/overlay CSS (~80 lines)
  js/
    hero3d.js         CREATE  — complete Three.js scene (renderer, camera, lights, building, timeline, parallax)
```

No other files touched. No new dependencies beyond CDN script tags.

---

## Task 1: HTML — Dependencies, preloader, canvas wrapper

**Files:**
- Modify: `ny-forside/index.html`

### What this task does
Adds Three.js importmap + GSAP CDN script, inserts the preloader overlay before `<body>` content, wraps the 3D canvas inside the `.hero` section, and restructures the existing hero text into a `#hero-ui` div that starts hidden.

- [ ] **Step 1: Add importmap + GSAP CDN to `<head>`**

Open `ny-forside/index.html`. Find the closing `</head>` tag. Insert this block immediately before it:

```html
  <!-- 3D Hero: Three.js via importmap, GSAP via CDN -->
  <script type="importmap">
  {
    "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js"
    }
  }
  </script>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
```

- [ ] **Step 2: Add preloader overlay as first child of `<body>`**

Find the opening `<body>` tag. Insert immediately after it:

```html
  <!-- ============ PRELOADER ============ -->
  <div id="hero-preloader" aria-hidden="true">
    <div class="pl-inner">
      <div class="pl-brand">Dietrichs Marketing</div>
      <div class="pl-track">
        <div class="pl-line" id="pl-line"></div>
        <span class="pl-pct" id="pl-pct">0%</span>
      </div>
    </div>
  </div>
```

- [ ] **Step 3: Add canvas wrapper inside `.hero` and restructure hero text**

Find the `<section class="hero">` block. Replace the entire section with:

```html
  <!-- ============ HERO ============ -->
  <section class="hero" id="hero">

    <!-- 3D canvas lives here, fills the section -->
    <div id="hero-canvas-wrapper" aria-hidden="true"></div>

    <!-- All existing hero text — hidden initially, revealed by GSAP -->
    <div id="hero-ui" class="wrap">
      <span class="label reveal"><span class="num">001</span><span class="bar"></span> AI-nettsider</span>
      <h1 class="hero-title display reveal">
        <span class="line">Kutt alle kostnader</span>
        <span class="line accent">for nettsiden.</span>
        <span class="line outline">Eier alt selv.</span>
      </h1>
      <div class="hero-bottom">
        <div class="hero-foot">
          <div class="scroll-hint reveal">
            Rull ned
            <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
          </div>
        </div>
        <div class="hero-intro">
          <p class="hero-lead reveal">
            Vi bygger en lynrask, AI-klar nettside du styrer helt selv. Oppdater innholdet på <strong>60&nbsp;sekunder</strong>, uten kode, uten byrå, uten faste månedsavgifter.
          </p>
          <div class="hero-cta reveal">
            <a class="btn btn-primary" href="#se-demo">Se demo-video
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </a>
            <a class="btn btn-ghost" href="#priser">Se priser</a>
          </div>
          <div class="reassure reveal">
            <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 13l4 4L19 7"/></svg> 100&nbsp;% eierskap</span>
            <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 13l4 4L19 7"/></svg> 0&nbsp;kr i faste kostnader</span>
            <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 13l4 4L19 7"/></svg> Superrask på Google</span>
          </div>
        </div>
      </div>
    </div>

  </section>
```

- [ ] **Step 4: Add hero3d.js module script before `</body>`**

Find the closing `</body>` tag. Insert immediately before it:

```html
  <script type="module" src="js/hero3d.js"></script>
```

- [ ] **Step 5: Verify in browser**

Open `ny-forside/index.html` in a browser (via a local server — run `python -m http.server 8080` in `ny-forside/`). Confirm:
- Page loads without console errors (importmap supported)
- Hero section text is still visible (no `hero3d.js` yet so `#hero-ui` shows normally)
- No layout breaks

---

## Task 2: CSS — Preloader + canvas + hero UI overlay

**Files:**
- Modify: `ny-forside/style.css`

### What this task does
Styles the preloader overlay (full-screen, warm paper background, centered layout, animated line). Styles the canvas wrapper (absolute-fills hero section). Styles `#hero-ui` to sit above the canvas and start invisible.

- [ ] **Step 1: Append preloader styles to `style.css`**

Add at the very end of `style.css`:

```css
/* =========================================================
   3D HERO — Preloader, Canvas, UI Overlay
   ========================================================= */

/* ── Preloader ───────────────────────────────────────────── */
#hero-preloader {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: var(--paper);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.pl-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  width: min(320px, 80vw);
}

.pl-brand {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--ink-faint);
}

.pl-track {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
}

.pl-line {
  flex: 1;
  height: 1.5px;
  background: var(--ink);
  transform-origin: left center;
  transform: scaleX(0);          /* GSAP animates this to scaleX(1) */
}

.pl-pct {
  font-size: 0.72rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
  color: var(--ink-faint);
  width: 3ch;
  text-align: right;
  flex-shrink: 0;
}

/* ── Canvas wrapper ──────────────────────────────────────── */
#hero-canvas-wrapper {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}

#hero-canvas-wrapper canvas {
  display: block;
  width: 100% !important;
  height: 100% !important;
}

/* ── Hero UI overlay (text + CTAs) ──────────────────────── */
#hero-ui {
  position: relative;
  z-index: 10;
  opacity: 0;                    /* GSAP reveals this after animation */
  transform: translateY(10px);   /* GSAP slides it up */
  will-change: opacity, transform;
}

/* Ensure hero section is tall enough for the 3D scene */
.hero {
  min-height: clamp(520px, 92vh, 860px);
}

/* Mobile: hero-ui always visible, no 3D */
@media (max-width: 767px) {
  #hero-ui {
    opacity: 1 !important;
    transform: none !important;
  }
  #hero-preloader {
    display: none !important;
  }
}
```

- [ ] **Step 2: Verify layout**

Refresh the browser. Confirm:
- Preloader is NOT visible yet (no JS running it), hero text shows normally
- Hero section has appropriate min-height (the section should be tall)
- No existing styles broken

---

## Task 3: Scene foundation — renderer, camera, lights, ground

**Files:**
- Create: `ny-forside/js/hero3d.js`

### What this task does
Creates the Three.js WebGLRenderer attached to `#hero-canvas-wrapper`, sets up the camera at its starting bird's-eye position, adds lights (ambient + directional with soft shadows + hemisphere fill), adds the ground plane and subtle grid, and starts the render loop.

- [ ] **Step 1: Create `js/hero3d.js` with scene foundation**

Create `ny-forside/js/hero3d.js` with this content:

```javascript
import * as THREE from 'three';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const CAMERA_START  = new THREE.Vector3(0, 18, 2);
const CAMERA_END    = new THREE.Vector3(-8, 5, 12);
const LOOK_TARGET   = new THREE.Vector3(0, 2, 0);

const COLOR_BG      = 0xFCFBF7;  // matches --paper CSS variable
const COLOR_GRID    = 0xE7E4D8;  // matches --line CSS variable
const COLOR_GROUND  = 0xF5F3EA;  // matches --paper-2 CSS variable
const COLOR_CYAN    = 0x06b6d4;  // blueprint wireframe
const COLOR_SOLID   = 0xf8fafc;  // premium matte white

// Building box configs: { w, h, d, x, y, z }
// Y position is the center of each box, calculated from stacking
const BOXES = [
  { w: 4.0, h: 0.6, d: 3.5, x:  0.0, y: 0.30,  z: 0.0 }, // 0: Podium
  { w: 2.0, h: 5.0, d: 2.2, x: -0.3, y: 3.10,  z: 0.0 }, // 1: Tower A (main)
  { w: 1.2, h: 3.5, d: 2.0, x:  0.9, y: 2.05,  z: 0.0 }, // 2: Tower B (wing)
  { w: 1.4, h: 1.5, d: 1.6, x: -0.3, y: 6.35,  z: 0.0 }, // 3: Setback
  { w: 0.8, h: 0.3, d: 0.8, x: -0.5, y: 7.25,  z: 0.0 }, // 4: Crown
];

// ─── MOBILE DETECTION ────────────────────────────────────────────────────────

const IS_MOBILE = window.innerWidth < 768 ||
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

if (IS_MOBILE) {
  // On mobile: show hero UI immediately, skip 3D entirely
  const ui = document.getElementById('hero-ui');
  if (ui) { ui.style.opacity = '1'; ui.style.transform = 'none'; }
  // Stop module execution
  throw new Error('3D hero: mobile detected, skipping.');
}

// ─── RENDERER ────────────────────────────────────────────────────────────────

const wrapper = document.getElementById('hero-canvas-wrapper');

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(wrapper.clientWidth, wrapper.clientHeight);
renderer.setClearColor(COLOR_BG, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
wrapper.appendChild(renderer.domElement);

// ─── SCENE ───────────────────────────────────────────────────────────────────

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(COLOR_BG, 30, 60);  // subtle fade at horizon

// ─── CAMERA ──────────────────────────────────────────────────────────────────

const camera = new THREE.PerspectiveCamera(
  45,
  wrapper.clientWidth / wrapper.clientHeight,
  0.1,
  120
);
camera.position.copy(CAMERA_START);
camera.lookAt(LOOK_TARGET);

// ─── LIGHTS ──────────────────────────────────────────────────────────────────

// Soft fill from all directions
const ambient = new THREE.AmbientLight(0xffffff, 0.65);
scene.add(ambient);

// Main directional "sun" — warm, casts shadows
const sun = new THREE.DirectionalLight(0xfff8f0, 2.4);
sun.position.set(12, 22, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.near = 1;
sun.shadow.camera.far  = 70;
sun.shadow.camera.left   = -14;
sun.shadow.camera.right  =  14;
sun.shadow.camera.top    =  14;
sun.shadow.camera.bottom = -14;
sun.shadow.radius = 4;      // PCF blur — makes shadows soft-edged
sun.shadow.bias   = -0.001;
scene.add(sun);

// Sky/ground hemisphere — adds subtle color variation
const hemi = new THREE.HemisphereLight(0xf0f4ff, 0xede8df, 0.45);
scene.add(hemi);

// ─── GROUND ──────────────────────────────────────────────────────────────────

const groundGeo = new THREE.PlaneGeometry(80, 80);
const groundMat = new THREE.MeshStandardMaterial({
  color: COLOR_GROUND,
  roughness: 0.92,
  metalness: 0,
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y  = 0;
ground.receiveShadow = true;
scene.add(ground);

// Subtle architectural grid on the ground
const grid = new THREE.GridHelper(50, 50, COLOR_GRID, COLOR_GRID);
grid.material.opacity     = 0.35;
grid.material.transparent = true;
grid.position.y = 0.001;  // just above ground to avoid z-fighting
scene.add(grid);

// ─── RENDER LOOP ─────────────────────────────────────────────────────────────

let prevTime = performance.now();

function tick() {
  requestAnimationFrame(tick);
  const now = performance.now();
  const dt  = Math.min((now - prevTime) / 1000, 0.05); // cap at 50ms
  prevTime  = now;

  if (typeof window._onTick === 'function') window._onTick(dt);

  renderer.render(scene, camera);
}
tick();

// ─── RESIZE ──────────────────────────────────────────────────────────────────

window.addEventListener('resize', () => {
  const w = wrapper.clientWidth;
  const h = wrapper.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});

// Export scene objects for subsequent tasks (added to window for plain JS access)
window._hero3d = { scene, camera, renderer, BOXES, CAMERA_END, LOOK_TARGET, COLOR_CYAN, COLOR_SOLID };
```

- [ ] **Step 2: Verify scene renders**

Refresh browser. Confirm:
- The hero section shows a warm off-white 3D canvas (ground plane visible)
- No console errors
- `window._hero3d` exists in DevTools console

---

## Task 4: Building geometry — 5 procedural boxes

**Files:**
- Modify: `ny-forside/js/hero3d.js`

### What this task does
Adds the five-box building to the scene. Each box has TWO meshes sharing the same geometry: one wireframe (cyan), one solid (white, starts invisible). Both start with `scale.y = 0.001` so they can animate growing upward.

- [ ] **Step 1: Add building creation after the ground/grid block**

In `hero3d.js`, find the `// ─── RENDER LOOP` comment. Insert this block immediately before it:

```javascript
// ─── BUILDING ────────────────────────────────────────────────────────────────

const buildingParts = BOXES.map(cfg => {
  // One geometry shared between both meshes (saves memory)
  const geo = new THREE.BoxGeometry(cfg.w, cfg.h, cfg.d);

  // Wireframe mesh — cyan blueprint lines
  const wireMat = new THREE.MeshBasicMaterial({
    color: COLOR_CYAN,
    wireframe: true,
    transparent: true,
    opacity: 1,
  });
  const wireMesh = new THREE.Mesh(geo, wireMat);

  // Solid mesh — premium white architectural material
  const solidMat = new THREE.MeshStandardMaterial({
    color: COLOR_SOLID,
    roughness: 0.18,
    metalness: 0.05,
    transparent: true,
    opacity: 0,     // invisible until animation solidifies it
  });
  const solidMesh = new THREE.Mesh(geo, solidMat);
  solidMesh.castShadow    = true;
  solidMesh.receiveShadow = true;

  // Position both meshes at the same world coordinates
  wireMesh.position.set(cfg.x, cfg.y, cfg.z);
  solidMesh.position.set(cfg.x, cfg.y, cfg.z);

  // Start flat (zero height) — GSAP will animate scale.y to 1
  wireMesh.scale.y  = 0.001;
  solidMesh.scale.y = 0.001;

  scene.add(wireMesh, solidMesh);
  return { wireMesh, solidMesh, geo };
});
```

- [ ] **Step 2: Verify building appears**

In browser DevTools console, run:
```javascript
window._hero3d.scene.children.length
```
Expected: 13+ (ground, grid, lights, 5×2 building meshes = ~13)

Also temporarily force a visible state by running in console:
```javascript
window._hero3d.scene.children
  .filter(c => c.isMesh && c.material.wireframe)
  .forEach(m => { m.scale.y = 1; });
```
You should see 5 cyan wireframe boxes forming a building silhouette. Press F5 to reset.

---

## Task 5: Particles — floating atmosphere dots

**Files:**
- Modify: `ny-forside/js/hero3d.js`

### What this task does
Adds 80 tiny lavender particle dots scattered through the scene volume. They drift by slowly rotating the Points object. Very cheap GPU cost (~0.01ms render time).

- [ ] **Step 1: Add particles after the building block**

In `hero3d.js`, find `// ─── RENDER LOOP`. Insert immediately before it:

```javascript
// ─── PARTICLES ───────────────────────────────────────────────────────────────

const PARTICLE_COUNT = 80;
const pPositions = new Float32Array(PARTICLE_COUNT * 3);

for (let i = 0; i < PARTICLE_COUNT; i++) {
  pPositions[i * 3 + 0] = (Math.random() - 0.5) * 28;   // x: ±14 units
  pPositions[i * 3 + 1] = Math.random() * 10 + 0.5;     // y: 0.5–10.5 units
  pPositions[i * 3 + 2] = (Math.random() - 0.5) * 28;   // z: ±14 units
}

const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));

const pMat = new THREE.PointsMaterial({
  color: 0xc7d2fe,   // lavender — cobalt-050 family
  size: 0.07,
  sizeAttenuation: true,
});

const particles = new THREE.Points(pGeo, pMat);
particles.visible = false;   // shown after animation lands
scene.add(particles);
```

- [ ] **Step 2: Hook particles into tick loop**

In the `tick()` function, after the `_onTick` call, add:

```javascript
  // Slow particle drift
  if (particles.visible) {
    particles.rotation.y += dt * 0.018;
  }
```

---

## Task 6: Mouse parallax system

**Files:**
- Modify: `ny-forside/js/hero3d.js`

### What this task does
Tracks mouse position normalized to `[-1, +1]`. After the animation lands, gently offsets the camera position each frame toward the mouse-influenced target. Uses lerp (4% per frame) for a silky-smooth elastic feel.

- [ ] **Step 1: Add mouse state and listener**

In `hero3d.js`, find `// ─── RENDER LOOP`. Insert before it:

```javascript
// ─── MOUSE PARALLAX ──────────────────────────────────────────────────────────

const mouse = { x: 0, y: 0 };
let parallaxActive = false;

window.addEventListener('mousemove', e => {
  if (!parallaxActive) return;
  mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2;  // -1 to +1
  mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;  // -1 to +1
});
```

- [ ] **Step 2: Apply parallax each tick**

Inside the `tick()` function, add after the particles rotation:

```javascript
  // Camera parallax — only active after animation lands
  if (parallaxActive) {
    const targetX = CAMERA_END.x + mouse.x * 1.2;
    const targetY = CAMERA_END.y - mouse.y * 0.5;
    camera.position.x += (targetX - camera.position.x) * 0.04;
    camera.position.y += (targetY - camera.position.y) * 0.04;
    camera.lookAt(LOOK_TARGET);
  }
```

- [ ] **Step 3: Export parallax activation**

At the bottom of `hero3d.js`, add `parallaxActive` to the export:

```javascript
window._hero3d.activateParallax = () => { parallaxActive = true; };
window._hero3d.particles = particles;
window._hero3d.buildingParts = buildingParts;
```

---

## Task 7: Preloader + GSAP animation master timeline

**Files:**
- Modify: `ny-forside/js/hero3d.js`

### What this task does
This is the centerpiece task. Creates:
1. The CSS preloader animation (line grows 0→100% over 1.3s, counter ticks up)
2. On preloader complete: fades out preloader, starts 3D animation timeline
3. 3D timeline: boxes spawn (staggered), camera swoops, wireframe dissolves, solid materializes, UI fades in

- [ ] **Step 1: Add the master animation function**

In `hero3d.js`, find `// Export scene objects`. Insert immediately before it:

```javascript
// ─── ANIMATION MASTER ────────────────────────────────────────────────────────

function startHeroAnimation() {
  const { buildingParts, camera, particles } = window._hero3d;
  const uiEl = document.getElementById('hero-ui');

  const tl = gsap.timeline();

  // ── Phase 2: Blueprint spawn ──────────────────────────────────────────────
  // Each box grows from scale.y=0 to 1, staggered 100ms
  buildingParts.forEach(({ wireMesh, solidMesh }, i) => {
    tl.to(
      [wireMesh.scale, solidMesh.scale],
      { y: 1, duration: 0.45, ease: 'power3.out' },
      i * 0.10  // stagger offset: 0, 0.1, 0.2, 0.3, 0.4 seconds
    );
  });

  // ── Phase 3a: Camera swoop ────────────────────────────────────────────────
  // Starts at t=0.5, camera travels from overhead to isometric landing
  const camProxy = {
    x: CAMERA_START.x,
    y: CAMERA_START.y,
    z: CAMERA_START.z,
  };
  tl.to(camProxy, {
    x: CAMERA_END.x,
    y: CAMERA_END.y,
    z: CAMERA_END.z,
    duration: 1.4,
    ease: 'power4.out',
    onUpdate() {
      camera.position.set(camProxy.x, camProxy.y, camProxy.z);
      camera.lookAt(LOOK_TARGET);
    },
  }, 0.5);

  // ── Phase 3b: Wireframe dissolves out ────────────────────────────────────
  // Starts at t=0.85 — wire fades to transparent while camera is mid-swoop
  buildingParts.forEach(({ wireMesh }) => {
    tl.to(wireMesh.material, {
      opacity: 0,
      duration: 0.55,
      ease: 'power2.in',
      onComplete() {
        scene.remove(wireMesh);  // cleanup to free draw call
      },
    }, 0.85);
  });

  // ── Phase 3c: Solid materializes ─────────────────────────────────────────
  // Starts at t=1.0 — solid fades in overlapping the wire fadeout
  buildingParts.forEach(({ solidMesh }) => {
    tl.to(solidMesh.material, {
      opacity: 1,
      duration: 0.60,
      ease: 'power2.out',
    }, 1.0);
  });

  // ── Phase 4: UI reveal ────────────────────────────────────────────────────
  // Starts at t=1.9 — text slides up and fades in
  tl.to(uiEl, {
    opacity: 1,
    y: 0,
    duration: 0.65,
    ease: 'power2.out',
  }, 1.9);

  // ── Activate particles + parallax after landing ───────────────────────────
  tl.call(() => {
    particles.visible = true;
    window._hero3d.activateParallax();
  }, null, 2.0);
}

// ─── PRELOADER SEQUENCE ──────────────────────────────────────────────────────

function runPreloader() {
  const preloaderEl = document.getElementById('hero-preloader');
  const lineEl      = document.getElementById('pl-line');
  const pctEl       = document.getElementById('pl-pct');

  if (!preloaderEl || !lineEl) {
    // No preloader in DOM — start 3D immediately (e.g. dev/hot reload)
    startHeroAnimation();
    return;
  }

  // Animate the line from scaleX(0) → scaleX(1) over 1.3 seconds
  gsap.to(lineEl, {
    scaleX: 1,
    duration: 1.3,
    ease: 'power2.inOut',
    onUpdate() {
      const pct = Math.round(gsap.getProperty(lineEl, 'scaleX') * 100);
      pctEl.textContent = pct + '%';
    },
    onComplete() {
      // Fade out the preloader overlay
      gsap.to(preloaderEl, {
        opacity: 0,
        duration: 0.35,
        ease: 'power1.in',
        onComplete() {
          preloaderEl.style.display = 'none';
        },
      });

      // Start 3D animation (slight offset so preloader fade and 3D start overlap)
      gsap.delayedCall(0.1, startHeroAnimation);
    },
  });
}

// Kick everything off
runPreloader();
```

- [ ] **Step 2: Verify full sequence in browser**

Refresh the page. You should see:
1. **0–1.3s**: White screen, thin line grows left to right, counter 0%→100%
2. **1.3–1.7s**: Preloader fades out, 3D scene visible, building is cyan wireframe
3. **1.7–2.3s**: Five building boxes grow upward sequentially
4. **2.3–3.7s**: Camera swoops from overhead to isometric, wireframe dissolves to solid white
5. **3.7–4.4s**: Hero text fades in with upward slide
6. **4.4s+**: Building sits in scene, mouse parallax active

Open DevTools → Performance tab, record 5 seconds, confirm no frame drops below 30fps.

---

## Task 8: Mobile fallback verification

**Files:**
- None to create (already handled in Task 3 and CSS Task 2)

### What this task does
Verifies that on mobile viewports: hero text is immediately visible, no 3D scene runs, no preloader appears.

- [ ] **Step 1: Test mobile in DevTools**

Open DevTools → Toggle device toolbar → Select "iPhone 14" (390px wide).

Refresh the page. Confirm:
- Hero text is immediately visible (no preloader, no 3D animation)
- No Three.js or GSAP errors in console
- Layout looks correct on 390px viewport

- [ ] **Step 2: Verify the mobile CSS override works**

In DevTools → Elements, confirm `#hero-ui` has `opacity: 1` and `transform: none` at 390px (applied by the `@media (max-width: 767px)` CSS rule from Task 2).

---

## Task 9: Final integration check

**Files:**
- Modify: `ny-forside/js/hero3d.js` (minor fix if needed)

### What this task does
Tests the full page experience, checks scroll behavior, and verifies the 3D canvas doesn't interfere with the rest of the page below the hero section.

- [ ] **Step 1: Check that scrolling works**

After the animation completes, scroll down the page. Confirm:
- The 3D canvas stays within the `.hero` section and does not overflow
- Subsequent sections (`#sniktitt`, `#hvordan`, etc.) render normally
- Nav stays fixed and readable at `z-index: 100` above the 3D canvas

- [ ] **Step 2: Check `#hero-canvas-wrapper` containment**

In DevTools → Elements, confirm `.hero` has `overflow: hidden` (already set in original CSS). The canvas wrapper has `position: absolute; inset: 0` — it fills the hero section exactly and goes no further.

- [ ] **Step 3: Performance audit**

In DevTools → Lighthouse, run a Performance audit (desktop). Target:
- LCP (hero text) < 4.5s
- No layout shift from canvas insertion (canvas is `position: absolute`, out of flow)
- FPS during animation: 55–60fps on a modern laptop

- [ ] **Step 4: Confirm GSAP doesn't conflict with existing `.reveal` animations**

Scroll down and back up. Confirm the existing scroll-reveal animations on `.reveal` elements still trigger in the sections below the hero.

---

## Task 10: Tuning pass — lighting, building proportions, camera angle

**Files:**
- Modify: `ny-forside/js/hero3d.js`

### What this task does
After seeing the full animation running, tweak the numbers to taste. This task documents which constants to adjust and what effect each has.

- [ ] **Step 1: Building proportions**

To make the building taller/slimmer (more Manhattan): increase `h` on boxes 1 and 2 (Tower A and B). Reduce `w` and `d`. Example:

```javascript
// More slender tower — change box index 1 from:
{ w: 2.0, h: 5.0, d: 2.2, x: -0.3, y: 3.10, z: 0.0 }
// To:
{ w: 1.6, h: 6.5, d: 1.8, x: -0.3, y: 3.85, z: 0.0 }
// Note: y must be h/2 + podium height (0.6) for correct stacking
```

- [ ] **Step 2: Camera end position**

`CAMERA_END = new THREE.Vector3(-8, 5, 12)` gives a slightly left-of-center, low-angle isometric view. Adjustments:
- Increase Z (e.g. `14`) → camera is further back, building appears smaller
- Decrease Y (e.g. `3`) → more dramatic low-angle, building towers over camera
- Increase X magnitude (e.g. `-10`) → more side-on view

- [ ] **Step 3: Shadow intensity**

`sun` intensity is `2.4`. To make shadows more dramatic (deeper, richer): increase to `3.0`. To soften (more overcast): decrease to `1.8`. The `ambient` intensity `0.65` fills the shadows — lower it for more contrast.

- [ ] **Step 4: Animation timing**

In `startHeroAnimation()`, the key timing anchors (GSAP timeline positions):
- `i * 0.10` (spawn stagger) → increase for slower, more theatrical spawn
- `0.5` (camera start) → delay camera swoop start
- `0.85` (wire fadeout start) → how far into camera swoop the material starts dissolving
- `1.9` (UI reveal) → when text appears

---

## Self-Review Checklist

- [x] **Spec coverage**: Preloader ✓, Blueprint spawn ✓, Camera swoop ✓, Wireframe→solid ✓, UI reveal ✓, Mouse parallax ✓, Particles ✓, Mobile fallback ✓, Performance target ✓
- [x] **Placeholders**: None — all steps contain actual code
- [x] **Type consistency**: `buildingParts` array created in Task 4, exported in Task 6 via `window._hero3d.buildingParts`, used correctly in `startHeroAnimation()`
- [x] **CAMERA_END** used in Task 3 (initial position reference) and Task 6 (parallax target) — consistent
- [x] **`particles`** created in Task 5, toggled visible in Task 7 via `window._hero3d.particles` — consistent
- [x] **Mobile**: CSS rule hides preloader + shows UI on ≤767px, JS throws early if mobile — two-layer protection
- [x] **No build step required**: all imports via CDN or importmap

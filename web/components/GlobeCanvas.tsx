'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { gsap } from 'gsap';
import type { EventSection, GlobeItem } from '@/lib/events';
import { plateSize, plateTransform, type GlobeShape } from '@/lib/globe';

/**
 * The gallery globe.
 *
 * PROVENANCE
 * ----------
 * Adapted from `globefolio-3d-image-animation/src/components/GlobeCanvas.tsx`
 * (Apache-2.0). Kept from it: the Fibonacci placement (now in lib/globe.ts), the
 * camera-starts-inside reveal, the texture cover-fit by repeat/offset, the
 * fallback-texture-then-swap pattern, and the zoom-to-mesh camera maths.
 *
 * Changed, and why:
 *
 *   - Plates are arch-shaped, clipped at texture-build time against the same
 *     path as the `arch` utility in globals.css. The site's aperture is its
 *     signature, and a sphere of little temple arches belongs here in a way that
 *     a sphere of rectangles does not.
 *   - The reveal runs on one GSAP tween instead of `setInterval(16)` inside
 *     `setTimeout`. The original drifts, keeps running on a blurred tab, and
 *     cannot be cancelled on unmount.
 *   - Two modes on one instance. The teaser is a sparse sphere inline in the
 *     page; opening the gallery morphs it to the full set and pulls the camera
 *     back through the plates. The renderer is never torn down and rebuilt, so
 *     there is no reload and no flash between the two.
 *   - Textures load in two passes, teaser set first — the same coarse/refine
 *     idea as the frame loading in ScrollStage, for the same reason.
 *   - Everything is disposed on unmount, including textures. The original leaks
 *     one texture per plate.
 *   - Rendering stops when the tab is hidden or the canvas has scrolled out of
 *     view, matching AmbientProvider.
 *
 * WHAT THIS COMPONENT DOES NOT DO
 * -------------------------------
 * It owns no chrome, no DOM list, and no routing. The photographs also exist as
 * real markup in GalleryGrid, which is what crawlers and screen readers get;
 * this canvas is a spectacle layered over content that already works without it.
 */

export type GlobeMode = 'teaser' | 'full';

export type GlobeHandle = {
  focusItem: (id: string) => void;
  resetView: () => void;
  /** null clears the filter */
  setFilter: (sections: EventSection[] | null) => void;
  setAutoRotate: (on: boolean) => void;
  setShape: (shape: GlobeShape) => void;
  /**
   * Re-run the camera-from-inside reveal. Called when the gallery is opened, so
   * the full-screen entrance is the same movement as the first one rather than
   * the sphere simply being larger.
   */
  replayReveal: () => void;
};

type Props = {
  items: GlobeItem[];
  mode: GlobeMode;
  /** Hover in, with viewport coordinates for the floating label. Null on out. */
  onHover?: (item: GlobeItem | null, screen?: { x: number; y: number }) => void;
  /** A plate was chosen, or the selection was cleared. */
  onSelect?: (item: GlobeItem | null) => void;
  /** Fired once the teaser textures have landed and the sphere is worth showing. */
  onReady?: () => void;
  /** Progress 0..1 while the teaser set loads. */
  onLoadProgress?: (loaded: number, total: number) => void;
  className?: string;
};

// ---------------------------------------------------------------------------
// Tuning
// ---------------------------------------------------------------------------

/** World-space sphere radius. Everything else is expressed relative to this. */
const RADIUS = 1.25;

/**
 * Plates displayed in teaser mode.
 *
 * Small enough that its distinct textures are a fraction of the full set — the
 * teaser costs roughly a third of the plate bytes — and large enough that the
 * window reads as a globe. Below about thirty it reads as a handful of cards
 * floating near each other instead.
 */
const TEASER_COUNT = 44;

/** Camera distance, as a multiple of RADIUS. 0.34 is inside the shell. */
const DIST = { inside: 0.34, teaser: 3.35, full: 3.35, min: 1.45, max: 9 };

/**
 * Clearance left around the sphere once it has been fitted to the frame.
 *
 * 1 would have the sphere exactly touching the tighter edge. On a wide window
 * this term does nothing — the base distance already clears the vertical fit —
 * so it only shapes the portrait case, where the binding axis is horizontal and
 * the slack it buys sits above and below the sphere, which is where the header
 * and the dock live anyway.
 */
const FIT_MARGIN = 1.06;

/**
 * Focused-plate framing, as a multiple of the plate's edge length.
 *
 * Derived rather than fixed, because plate size falls as the item count rises —
 * a constant distance that framed 44 plates nicely put the camera inside the
 * shell at 107. At 2.6x the plate fills roughly half the frame height at this
 * field of view, with the rest of the sphere legible behind it.
 */
const FOCUS_GAP = 2.6;

/** Hover and focus pop. */
const SCALE = { rest: 1, hover: 1.18, focus: 1.3 };

/**
 * Opacity of plates filtered out.
 *
 * Applied instead of the facing dim rather than on top of it. Multiplying the
 * two took filtered plates on the far side to 0.04, which is nothing — pick a
 * section with eight members and the other ninety-nine vanish, so the sphere
 * stops being a sphere and the filter reads as a bug. Held flat, the unselected
 * plates stay legible as structure while the selected ones clearly carry the
 * image.
 */
const DIM = 0.16;

/**
 * Opacity floor for plates on the far side of the sphere.
 *
 * Plates face radially outward, so the ones on the back are seen from behind.
 * Culling them with FrontSide would be cheapest and would remove the mirrored
 * text, but the reveal begins with the camera inside the shell, where every
 * plate faces away — the entrance would be a blank screen. Dimming by facing
 * instead keeps the reveal, kills the mirrored-poster artifact, and gives the
 * sphere the depth cue that a flat wall of plates lacks: near plates read
 * forward, the silhouette edge falls away, the far side is a faint suggestion
 * seen through the gaps.
 *
 * 0.14 was too severe — the back went to nothing and the sphere stopped reading
 * as a solid. Just under a third keeps it legible as the other side of something.
 */
const BACK_DIM = 0.32;

/**
 * Shapes the falloff between BACK_DIM and full.
 *
 * Below 1 it lifts the middle, which is what this needs, and it needs it harder
 * than seems reasonable. The facing term is computed against the true view
 * vector, so perspective already pushes plates at the silhouette down to about
 * 0.36 before any curve applies — and a photograph at 65% over a cream ground
 * loses most of its contrast, so the sphere washed out to a ghost with only the
 * few plates at dead centre reading properly. At 0.45 the whole near hemisphere
 * stays crisp and the falloff is spent where it belongs, on the far side.
 */
const FACING_CURVE = 0.45;

/** Per-frame lerp rates. Higher is snappier; these are tuned for 60fps. */
const EASE = { scale: 0.16, position: 0.08, opacity: 0.12, distance: 0.09 };

/** How many plates are mid-fade at once during the reveal sweep. */
const REVEAL_FEATHER = 14;

/**
 * The temple arch, authored for a 720x1000 box — byte-identical to the path in
 * the `arch` utility and in ArchOutline. Stretched to a square plate here, which
 * is what `preserveAspectRatio="none"` does everywhere else on the site.
 */
const ARCH_PATH_D = 'M0 1000V420C0 196 150 54 360 24c210 30 360 172 360 396v580Z';
const ARCH_BOX = { w: 720, h: 1000 };

/** Texture edge. Matches PLATE_SIZE in lib/events.ts and the prep script. */
const TEX = 512;

const COLOR = {
  marigold: '#ec9a29',
  cream: '#fbf8f1',
  silk: '#f4ebd9',
  teal: '#0f4c5c',
  ink: '#2b1e16',
};

// ---------------------------------------------------------------------------
// Texture building
// ---------------------------------------------------------------------------

/**
 * Cover-fit source rectangle for drawing `img` into a square of `size`.
 *
 * Biased upward by the same 0.35 the plate prep script uses: the bottom of a
 * dance photograph is floor, the top is faces and hands. The plates are already
 * square coming out of ffmpeg, so this only does work if a non-square image is
 * ever passed in — which is exactly why it is here rather than assumed away.
 */
function coverRect(img: HTMLImageElement, size: number) {
  const scale = Math.max(size / img.width, size / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  return { x: (size - w) / 2, y: (size - h) * 0.35, w, h };
}

function archPath(): Path2D {
  return new Path2D(ARCH_PATH_D);
}

/** Applies the arch as a clip, in plate pixel space. */
function clipToArch(ctx: CanvasRenderingContext2D, size: number) {
  ctx.setTransform(size / ARCH_BOX.w, 0, 0, size / ARCH_BOX.h, 0, 0);
  ctx.clip(archPath());
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function strokeArch(ctx: CanvasRenderingContext2D, size: number, width: number, color: string) {
  ctx.save();
  ctx.setTransform(size / ARCH_BOX.w, 0, 0, size / ARCH_BOX.h, 0, 0);
  ctx.strokeStyle = color;
  // Divide out the transform so the drawn hairline is `width` device pixels.
  ctx.lineWidth = width * (ARCH_BOX.w / size);
  ctx.stroke(archPath());
  ctx.restore();
}

/**
 * The play affordance drawn onto video plates.
 *
 * A plate that zooms in and a plate that leaves for YouTube must not look
 * identical — that is the whole argument for the hover label, and it applies
 * doubly before the pointer ever arrives. A ring and triangle in marigold, low
 * on the plate so it does not sit over a face.
 */
function drawPlayGlyph(ctx: CanvasRenderingContext2D, size: number) {
  const cx = size / 2;
  const cy = size * 0.76;
  const r = size * 0.082;

  ctx.save();
  ctx.fillStyle = 'rgba(251, 248, 241, 0.86)';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = COLOR.marigold;
  ctx.lineWidth = Math.max(2, size * 0.006);
  ctx.stroke();

  ctx.fillStyle = COLOR.teal;
  ctx.beginPath();
  const t = r * 0.46;
  ctx.moveTo(cx - t * 0.7, cy - t);
  ctx.lineTo(cx - t * 0.7, cy + t);
  ctx.lineTo(cx + t * 0.95, cy);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Arch-clipped plate from a loaded image. */
function buildPlate(img: HTMLImageElement, isVideo: boolean): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = TEX;
  canvas.height = TEX;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.save();
  clipToArch(ctx, TEX);
  const r = coverRect(img, TEX);
  ctx.drawImage(img, r.x, r.y, r.w, r.h);

  // Warm the photograph toward the page's palette so ninety-odd plates read as
  // one object rather than a contact sheet. Very light: 6% silk.
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = 'rgba(244, 235, 217, 0.06)';
  ctx.fillRect(0, 0, TEX, TEX);
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();

  if (isVideo) drawPlayGlyph(ctx, TEX);
  strokeArch(ctx, TEX, isVideo ? 4 : 2.5, isVideo ? COLOR.marigold : 'rgba(236, 154, 41, 0.62)');

  return canvas;
}

/**
 * Shown until the real plate lands. Cream ground, arch hairline, a small
 * centred mark — deliberately quiet, because ninety of these appearing at once
 * would otherwise read as an error state.
 */
function buildFallbackPlate(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = TEX;
  canvas.height = TEX;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.save();
  clipToArch(ctx, TEX);
  const grad = ctx.createLinearGradient(0, 0, 0, TEX);
  grad.addColorStop(0, COLOR.cream);
  grad.addColorStop(1, COLOR.silk);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, TEX, TEX);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = 'rgba(236, 154, 41, 0.34)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(TEX / 2, TEX / 2, TEX * 0.1, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  strokeArch(canvas.getContext('2d')!, TEX, 2.5, 'rgba(236, 154, 41, 0.45)');
  return canvas;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type PlateMesh = THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> & {
  userData: {
    item: GlobeItem;
    index: number;
    targetPos: THREE.Vector3;
    targetQuat: THREE.Quaternion;
    baseScale: number;
    targetScale: number;
    /** Beyond the teaser cut: present in the scene but not shown. */
    parked: boolean;
    /** Excluded by the current section filter. */
    filtered: boolean;
    revealOpacity: number;
  };
};

const GlobeCanvas = forwardRef<GlobeHandle, Props>(function GlobeCanvas(
  { items, mode, onHover, onSelect, onReady, onLoadProgress, className = '' },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // three.js lives entirely in refs: none of it should ever trigger a re-render.
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshesRef = useRef<PlateMesh[]>([]);
  const geometryRef = useRef<THREE.PlaneGeometry | null>(null);
  const texturesRef = useRef<Map<string, THREE.CanvasTexture>>(new Map());
  const fallbackTexRef = useRef<THREE.CanvasTexture | null>(null);

  const rafRef = useRef(0);
  const shapeRef = useRef<GlobeShape>('sphere');
  const modeRef = useRef<GlobeMode>(mode);
  const focusedRef = useRef<PlateMesh | null>(null);
  const hoveredRef = useRef<PlateMesh | null>(null);

  const distRef = useRef(DIST.inside);
  const targetDistRef = useRef(DIST.inside);
  const camGoalRef = useRef<THREE.Vector3 | null>(null);
  const targetGoalRef = useRef<THREE.Vector3 | null>(null);

  /**
   * Resting distance for the current mode, corrected for the frame's shape.
   *
   * The field of view is vertical, so on a portrait phone the horizontal frustum
   * is far narrower than the vertical one and a distance tuned on a desktop
   * window leaves the sphere hanging off both sides. Fitting against whichever
   * axis is tighter costs nothing on a wide window — 3.35 already clears the
   * vertical fit there, so the base wins — and roughly doubles the distance at
   * 390x844, which is what the geometry actually asks for.
   */
  function restingDistance(): number {
    const camera = cameraRef.current;
    const base = modeRef.current === 'teaser' ? DIST.teaser : DIST.full;
    if (!camera) return base;

    const vFov = (camera.fov * Math.PI) / 180;
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
    const needed = FIT_MARGIN / Math.sin(Math.min(vFov, hFov) / 2);

    return Math.min(DIST.max, Math.max(base, needed));
  }

  const revealRef = useRef({ progress: 0 });
  const revealTweenRef = useRef<gsap.core.Tween | null>(null);
  const visibleRef = useRef(true);

  // Callbacks through refs so the scene effect never needs them as deps.
  const onHoverRef = useRef(onHover);
  const onSelectRef = useRef(onSelect);
  const onReadyRef = useRef(onReady);
  const onProgressRef = useRef(onLoadProgress);
  onHoverRef.current = onHover;
  onSelectRef.current = onSelect;
  onReadyRef.current = onReady;
  onProgressRef.current = onLoadProgress;

  // -------------------------------------------------------------------------
  // Layout — recomputed on mode or shape change, then lerped toward.
  // -------------------------------------------------------------------------
  function applyLayout() {
    const meshes = meshesRef.current;
    if (meshes.length === 0) return;

    const isTeaser = modeRef.current === 'teaser';
    const shown = isTeaser ? Math.min(TEASER_COUNT, meshes.length) : meshes.length;
    const size = plateSize(shown, RADIUS);
    const dummy = new THREE.Object3D();

    meshes.forEach((mesh, i) => {
      // In teaser mode the plates beyond the cut are parked at their full-sphere
      // position with no scale, so opening the gallery expands them from where
      // they will end up rather than throwing them across the screen.
      const total = isTeaser ? shown : meshes.length;
      const t = plateTransform(shapeRef.current, i, Math.max(total, 1), RADIUS);

      mesh.userData.targetPos.set(t.position[0], t.position[1], t.position[2]);
      dummy.position.set(t.position[0], t.position[1], t.position[2]);
      dummy.lookAt(t.lookAt[0], t.lookAt[1], t.lookAt[2]);
      mesh.userData.targetQuat.setFromEuler(dummy.rotation);

      const withinTeaser = i < shown;
      mesh.userData.baseScale = size;
      mesh.userData.parked = isTeaser && !withinTeaser;
      mesh.userData.targetScale = mesh.userData.parked ? 0 : SCALE.rest;
    });
  }

  useImperativeHandle(ref, () => ({
    focusItem(id) {
      const mesh = meshesRef.current.find((m) => m.userData.item.id === id);
      if (mesh) focusMesh(mesh, false);
    },
    resetView() {
      clearFocus(false);
    },
    setFilter(sections) {
      meshesRef.current.forEach((m) => {
        m.userData.filtered = Boolean(sections) && !sections!.includes(m.userData.item.section);
      });
    },
    setAutoRotate(on) {
      const controls = controlsRef.current;
      if (controls) controls.autoRotate = on && !focusedRef.current;
    },
    setShape(shape) {
      shapeRef.current = shape;
      applyLayout();
    },
    replayReveal() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        revealRef.current.progress = 1;
        return;
      }
      revealTweenRef.current?.kill();
      revealRef.current.progress = 0;
      distRef.current = DIST.inside;
      revealTweenRef.current = gsap.to(revealRef.current, {
        progress: 1,
        duration: 1.9,
        ease: 'power2.out',
      });
    },
  }));

  // -------------------------------------------------------------------------
  // Focus / unfocus
  // -------------------------------------------------------------------------
  function focusMesh(mesh: PlateMesh, notify: boolean) {
    const controls = controlsRef.current;
    if (!cameraRef.current || !controls) return;

    focusedRef.current = mesh;
    controls.autoRotate = false;
    controls.enableRotate = false;

    const world = mesh.getWorldPosition(new THREE.Vector3());
    /**
     * Approach along the plate's own outward normal, not along the camera's
     * current view direction.
     *
     * The reference implementation used the view direction, which works only
     * while the plate is on the near side of the sphere. Select something on the
     * far side and `plate + viewDir * gap` lands between the plate and the
     * centre — the camera ends up inside the shell, looking at the back of the
     * thing it was asked to show. Plates face radially outward, so their
     * position normalised *is* the direction to stand in.
     */
    const outward = world.clone().normalize();
    const gap = mesh.userData.baseScale * FOCUS_GAP;
    camGoalRef.current = world.clone().addScaledVector(outward, gap);
    targetGoalRef.current = world.clone();

    meshesRef.current.forEach((m) => {
      m.userData.targetScale = m.userData.parked ? 0 : m === mesh ? SCALE.focus : SCALE.rest;
    });

    if (notify) onSelectRef.current?.(mesh.userData.item);
  }

  function clearFocus(notify: boolean) {
    const controls = controlsRef.current;
    if (!controls) return;

    focusedRef.current = null;
    // Nulling the goal hands the camera back to the distance lerp in the frame
    // loop, which also walks controls.target back to the origin.
    camGoalRef.current = null;
    targetGoalRef.current = null;
    controls.enableRotate = true;
    targetDistRef.current = restingDistance();

    meshesRef.current.forEach((m) => {
      m.userData.targetScale = m.userData.parked ? 0 : SCALE.rest;
    });

    if (notify) onSelectRef.current?.(null);
  }

  // -------------------------------------------------------------------------
  // Scene — built once, then driven imperatively.
  // -------------------------------------------------------------------------
  useEffect(() => {
    const host = hostRef.current;
    const canvasEl = canvasRef.current;
    if (!host || !canvasEl) return;

    /**
     * Re-bound with a non-nullable declared type on purpose. The `function`
     * declarations further down are hoisted, so TypeScript considers them
     * created before the guard above and discards the narrowing on `canvasEl`
     * inside them. Assigning to a binding that is never null to begin with is
     * cheaper than sprinkling non-null assertions through every handler.
     */
    const canvas: HTMLCanvasElement = canvasEl;

    /**
     * Local handle on the shared texture map. Captured here rather than read
     * from the ref in the cleanup, because by teardown the ref may already point
     * elsewhere and the textures would leak silently.
     */
    const textures = texturesRef.current;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      48,
      host.clientWidth / Math.max(1, host.clientHeight),
      0.01,
      100,
    );
    camera.position.set(0, 0, RADIUS * DIST.inside);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, canvas);
    controls.enablePan = false;
    // Zoom is driven by a lerped target below, so the wheel does not fight the
    // reveal tween or snap while the camera is already moving.
    controls.enableZoom = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.rotateSpeed = 0.38;
    // Started from the motion preference rather than unconditionally. The dock's
    // play/pause control takes over from here.
    controls.autoRotate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    controls.autoRotateSpeed = 0.42;
    controls.minDistance = RADIUS * DIST.min;
    controls.maxDistance = RADIUS * DIST.max;
    controlsRef.current = controls;

    // --- plates ------------------------------------------------------------
    const geometry = new THREE.PlaneGeometry(1, 1);
    geometryRef.current = geometry;

    const fallbackCanvas = buildFallbackPlate();
    const fallbackTex = new THREE.CanvasTexture(fallbackCanvas);
    fallbackTex.colorSpace = THREE.SRGBColorSpace;
    fallbackTexRef.current = fallbackTex;

    const meshes: PlateMesh[] = items.map((item, index) => {
      const material = new THREE.MeshBasicMaterial({
        map: fallbackTex,
        transparent: true,
        opacity: 0,
        // Arch plates are alpha cutouts on a curved shell. Writing depth would
        // punch holes in whatever is behind the transparent corners; three's
        // back-to-front sort for transparent objects is exactly the order we
        // want on a sphere, so let it do the work.
        depthWrite: false,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(geometry, material) as PlateMesh;
      mesh.userData = {
        item,
        index,
        targetPos: new THREE.Vector3(),
        targetQuat: new THREE.Quaternion(),
        baseScale: 0.2,
        targetScale: SCALE.rest,
        parked: false,
        filtered: false,
        revealOpacity: 0,
      };
      mesh.scale.setScalar(0.001);
      scene.add(mesh);
      return mesh;
    });
    meshesRef.current = meshes;
    applyLayout();

    // Place each mesh at its target immediately so the first frame is a sphere
    // rather than a point at the origin collapsing outward.
    meshes.forEach((m) => {
      m.position.copy(m.userData.targetPos);
      m.quaternion.copy(m.userData.targetQuat);
    });

    // --- textures, teaser set first ---------------------------------------
    const teaserKeys = new Set(items.slice(0, TEASER_COUNT).map((i) => i.plate));
    const allKeys = [...new Set(items.map((i) => i.plate))];
    const ordered = [
      ...allKeys.filter((k) => teaserKeys.has(k)),
      ...allKeys.filter((k) => !teaserKeys.has(k)),
    ];

    let disposed = false;
    let teaserLoaded = 0;
    let readyFired = false;

    function assign(plate: string, texture: THREE.CanvasTexture) {
      meshesRef.current.forEach((m) => {
        if (m.userData.item.plate !== plate) return;
        m.material.map = texture;
        m.material.needsUpdate = true;
      });
    }

    function loadPlate(plate: string): Promise<void> {
      return new Promise((resolve) => {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => {
          if (disposed) return resolve();
          // Whether this plate carries a video glyph is a property of the items
          // using it, not of the file. All items sharing a plate agree, because
          // a video's plate key is its own poster.
          const isVideo = items.some((i) => i.plate === plate && i.kind === 'video');
          const texture = new THREE.CanvasTexture(buildPlate(img, isVideo));
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.generateMipmaps = true;
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
          textures.set(plate, texture);
          assign(plate, texture);
          resolve();
        };
        // A missing plate keeps the fallback. Not worth failing the gallery over.
        img.onerror = () => resolve();
        img.src = plate;
      });
    }

    (async () => {
      const teaserTotal = ordered.filter((k) => teaserKeys.has(k)).length;

      for (const plate of ordered) {
        if (disposed) return;
        await loadPlate(plate);

        if (teaserKeys.has(plate)) {
          teaserLoaded += 1;
          onProgressRef.current?.(teaserLoaded, teaserTotal);
          if (!readyFired && teaserLoaded >= teaserTotal) {
            readyFired = true;
            onReadyRef.current?.();
          }
        }
      }
    })();

    // --- reveal ------------------------------------------------------------
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    revealRef.current.progress = 0;
    targetDistRef.current = restingDistance();

    if (reduced) {
      gsap.set(revealRef.current, { progress: 1 });
      distRef.current = targetDistRef.current;
      camera.position.set(0, 0, RADIUS * distRef.current);
    } else {
      revealTweenRef.current = gsap.to(revealRef.current, {
        progress: 1,
        duration: 2.1,
        ease: 'power2.out',
        delay: 0.15,
      });
    }

    // --- pointer -----------------------------------------------------------
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let dragged = false;
    let downAt = { x: 0, y: 0 };

    function pick(event: PointerEvent): PlateMesh | null {
      const camera = cameraRef.current;
      if (!camera) return null;
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(meshesRef.current, false);
      // Skip plates parked at zero scale in teaser mode, and plates dimmed to
      // the back of the sphere — neither is there as far as the visitor is
      // concerned, and picking one would travel the camera to something they
      // cannot see.
      const hit = hits.find((h) => {
        const plate = h.object as PlateMesh;
        return plate.scale.x > 0.01 && plate.material.opacity > 0.35;
      });
      return (hit?.object as PlateMesh) ?? null;
    }

    function onPointerMove(event: PointerEvent) {
      if (modeRef.current === 'teaser') return;
      if (focusedRef.current) return;

      const mesh = pick(event);
      if (mesh === hoveredRef.current) {
        if (mesh) onHoverRef.current?.(mesh.userData.item, { x: event.clientX, y: event.clientY });
        return;
      }

      hoveredRef.current = mesh;
      meshesRef.current.forEach((m) => {
        if (m.userData.parked) return;
        m.userData.targetScale = m === mesh ? SCALE.hover : SCALE.rest;
      });

      canvas.style.cursor = mesh ? 'pointer' : 'grab';
      onHoverRef.current?.(
        mesh ? mesh.userData.item : null,
        mesh ? { x: event.clientX, y: event.clientY } : undefined,
      );
    }

    function onPointerDown(event: PointerEvent) {
      dragged = false;
      downAt = { x: event.clientX, y: event.clientY };
    }

    function onPointerUp(event: PointerEvent) {
      if (modeRef.current === 'teaser') return;
      const moved = Math.hypot(event.clientX - downAt.x, event.clientY - downAt.y);
      // An orbit drag must not also select whatever was under the finger.
      if (moved > 6) {
        dragged = true;
        return;
      }
      if (dragged) return;

      const mesh = pick(event);
      if (!mesh) return;
      focusMesh(mesh, true);
    }

    function onPointerLeave() {
      if (!hoveredRef.current) return;
      hoveredRef.current = null;
      meshesRef.current.forEach((m) => {
        if (m.userData.parked) return;
        m.userData.targetScale = SCALE.rest;
      });
      onHoverRef.current?.(null);
    }

    function onWheel(event: WheelEvent) {
      if (modeRef.current === 'teaser' || focusedRef.current) return;
      event.preventDefault();
      targetDistRef.current = THREE.MathUtils.clamp(
        targetDistRef.current + event.deltaY * 0.0022,
        DIST.min,
        DIST.max,
      );
    }

    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerLeave);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    // --- visibility --------------------------------------------------------
    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
      },
      { rootMargin: '200px' },
    );
    observer.observe(host);

    function onVisibilityChange() {
      if (document.hidden) visibleRef.current = false;
      else visibleRef.current = true;
    }
    document.addEventListener('visibilitychange', onVisibilityChange);

    // --- resize ------------------------------------------------------------
    const resize = new ResizeObserver(() => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      // A phone rotated to landscape halves the distance the sphere needs; not
      // refitting here would leave it marooned in the middle of the frame.
      if (!focusedRef.current) targetDistRef.current = restingDistance();
    });
    resize.observe(host);

    // --- frame loop --------------------------------------------------------
    const scratchQuat = new THREE.Quaternion();
    const scratchDir = new THREE.Vector3();
    const plateNormal = new THREE.Vector3();
    const toCamera = new THREE.Vector3();
    const origin = new THREE.Vector3(0, 0, 0);

    function frame() {
      rafRef.current = requestAnimationFrame(frame);
      if (!visibleRef.current) return;

      const meshes = meshesRef.current;
      const count = meshes.length;
      const progress = revealRef.current.progress;

      // Camera: either travelling to a focused plate, or holding a distance.
      if (camGoalRef.current && targetGoalRef.current) {
        camera.position.lerp(camGoalRef.current, EASE.distance);
        controls.target.lerp(targetGoalRef.current, EASE.distance);
        if (camera.position.distanceTo(camGoalRef.current) < 0.004) camGoalRef.current = null;
      } else {
        controls.target.lerp(origin, EASE.distance);
        /**
         * During the reveal the tween owns the distance outright. Lerping toward
         * a value that is itself being lerped eases the ease, which stretched a
         * 2s entrance into a five-second drift — long enough that the sphere
         * looked stuck inside itself. Once the reveal is done the lerp takes
         * over, so wheel zoom still glides.
         */
        if (progress < 1) {
          distRef.current = THREE.MathUtils.lerp(DIST.inside, targetDistRef.current, progress);
        } else {
          distRef.current = THREE.MathUtils.lerp(
            distRef.current,
            targetDistRef.current,
            EASE.distance,
          );
        }

        scratchDir.copy(camera.position).normalize();
        if (scratchDir.lengthSq() < 1e-6) scratchDir.set(0, 0, 1);
        camera.position.copy(scratchDir.multiplyScalar(RADIUS * distRef.current));
      }

      for (let i = 0; i < count; i += 1) {
        const mesh = meshes[i];
        const data = mesh.userData;

        // Reveal sweep: plates fade up in index order, a band at a time.
        data.revealOpacity = THREE.MathUtils.clamp(
          (progress * (count + REVEAL_FEATHER) - i) / REVEAL_FEATHER,
          0,
          1,
        );

        const wantScale = data.baseScale * data.targetScale;
        const scale = THREE.MathUtils.lerp(mesh.scale.x, wantScale, EASE.scale);
        mesh.scale.setScalar(scale);

        if (mesh.position.distanceToSquared(data.targetPos) > 1e-6) {
          mesh.position.lerp(data.targetPos, EASE.position);
        }
        if (!scratchQuat.copy(data.targetQuat).equals(mesh.quaternion)) {
          mesh.quaternion.slerp(data.targetQuat, EASE.position);
        }

        const wantOpacity = data.revealOpacity * (data.filtered ? DIM : facingOf(mesh));
        mesh.material.opacity = THREE.MathUtils.lerp(
          mesh.material.opacity,
          wantOpacity,
          EASE.opacity,
        );
        mesh.visible = mesh.material.opacity > 0.004 && scale > 0.002;
      }

      controls.update();
      renderer.render(scene, camera);
    }

    /**
     * 1 for a plate squarely facing the camera, BACK_DIM for one turned away.
     *
     * Taken from the plate's real normal rather than from its position. Position
     * works for the sphere, where normals are radial by construction, and is
     * wrong for the ring, where they are horizontal regardless of how high up the
     * barrel a plate sits — using position there dimmed the top and bottom rows
     * for no reason. A quaternion application per plate per frame is nothing next
     * to the draw call it is deciding about.
     */
    function facingOf(mesh: PlateMesh): number {
      plateNormal.set(0, 0, 1).applyQuaternion(mesh.quaternion);
      toCamera.copy(camera.position).sub(mesh.position).normalize();
      const facing = (plateNormal.dot(toCamera) + 1) * 0.5;
      return BACK_DIM + (1 - BACK_DIM) * facing ** FACING_CURVE;
    }

    frame();

    // --- teardown ----------------------------------------------------------
    return () => {
      disposed = true;
      cancelAnimationFrame(rafRef.current);
      revealTweenRef.current?.kill();
      revealTweenRef.current = null;

      observer.disconnect();
      resize.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('wheel', onWheel);

      controls.dispose();

      // Materials are per-mesh; textures are shared, so they are disposed from
      // the map rather than per mesh. Missing either of these is the leak the
      // reference implementation has.
      meshesRef.current.forEach((mesh) => {
        scene.remove(mesh);
        mesh.material.dispose();
      });
      meshesRef.current = [];

      textures.forEach((texture) => texture.dispose());
      textures.clear();
      fallbackTex.dispose();
      geometry.dispose();

      renderer.dispose();
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
    };
    // Built once. `items` is derived from a module constant and never changes
    // identity across the component's life; re-running this would rebuild the
    // whole scene and defeat the point of keeping one instance across modes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------------------
  // Mode change — morph rather than rebuild.
  // -------------------------------------------------------------------------
  useEffect(() => {
    modeRef.current = mode;
    const renderer = rendererRef.current;
    const controls = controlsRef.current;
    const canvas = canvasRef.current;
    if (!renderer || !controls || !canvas) return;

    applyLayout();

    if (mode === 'full') {
      // Full mode gets the device's real pixel ratio and interactive controls.
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      controls.enableRotate = true;
      controls.autoRotateSpeed = 0.42;
      targetDistRef.current = restingDistance();
      canvas.style.cursor = 'grab';
    } else {
      // The teaser is decoration inside a button: it must not eat the click, and
      // it does not need to be sharp.
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      controls.enableRotate = false;
      controls.autoRotate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      controls.autoRotateSpeed = 0.3;
      targetDistRef.current = restingDistance();
      hoveredRef.current = null;
      focusedRef.current = null;
      camGoalRef.current = null;
      onHoverRef.current?.(null);
    }
  }, [mode]);

  return (
    <div ref={hostRef} className={`relative h-full w-full ${className}`}>
      <canvas
        ref={canvasRef}
        className="block h-full w-full outline-none"
        style={{
          touchAction: 'none',
          // In teaser mode the surrounding button owns the interaction.
          pointerEvents: mode === 'full' ? 'auto' : 'none',
        }}
        aria-hidden
      />
    </div>
  );
});

export default GlobeCanvas;

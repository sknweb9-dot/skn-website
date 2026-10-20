'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { gsap } from 'gsap';
import { plateExtent, plateTransform, type GlobeShape } from '@/lib/globe';
import {
  BACK_DIM,
  DIM,
  DIST,
  EASE,
  FACING_CURVE,
  FIT_MARGIN,
  FOCUS_GAP,
  POP,
  RADIUS,
  REVEAL_FEATHER,
  TEASER_COUNT,
} from './globe/tuning';
import { buildFallbackPlate, buildPlate } from './globe/textures';
import type { GlobeHandle, GlobeMode, GlobeProps, PlateMesh } from './globe/types';

export type { GlobeHandle, GlobeMode } from './globe/types';

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
 *   - Plates are the whole photograph, never cropped: a third of the images are
     posters whose text runs to the margins (see buildPlate in globe/textures.ts).
 *   - The reveal runs on one GSAP tween instead of `setInterval(16)` inside
 *     `setTimeout`. The original drifts, keeps running on a blurred tab, and
 *     cannot be cancelled on unmount.
 *   - Two modes on one instance. The teaser is a sparse sphere inline in the
 *     page; opening the gallery morphs it to the full set and pulls the camera
 *     back through the plates. The renderer is never torn down and rebuilt, so
 *     there is no reload and no flash between the two.
 *   - Textures load in two passes, teaser set first — the same coarse/refine
 *     idea as the home arch's frame loading, for the same reason.
 *   - Everything is disposed on unmount, including textures. The original leaks
 *     one texture per plate.
 *   - Rendering stops when the tab is hidden or the canvas has scrolled out of
 *     view.
 *
 * WHAT THIS COMPONENT DOES NOT DO
 * -------------------------------
 * It owns no chrome, no DOM list, and no routing. Every photograph also exists as
 * real markup in the gallery index (components/gallery/GalleryIndex.tsx), which is
 * what crawlers and screen readers get; this canvas is a spectacle layered over
 * content that already works without it.
 */

const GlobeCanvas = forwardRef<GlobeHandle, GlobeProps>(function GlobeCanvas(
  { items, mode, onHover, onSelect, onReady, onLoadProgress, embedded = false, className = '' },
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
  const embeddedRef = useRef(embedded);
  embeddedRef.current = embedded;
  const focusedRef = useRef<PlateMesh | null>(null);
  const hoveredRef = useRef<PlateMesh | null>(null);

  const distRef = useRef(DIST.inside);
  const targetDistRef = useRef(DIST.inside);
  const camGoalRef = useRef<THREE.Vector3 | null>(null);
  const targetGoalRef = useRef<THREE.Vector3 | null>(null);
  /** True while the camera is gliding back to the front view (resetView). */
  const homeRef = useRef(false);

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

      // Equal area per plate, shaped to the image's own ratio. The item carries
      // its real pixel dimensions, so a landscape photograph comes out wide and
      // an invitation card comes out tall, both occupying the same footprint.
      const aspect = mesh.userData.item.width / Math.max(1, mesh.userData.item.height);
      const extent = plateExtent(Math.max(total, 1), RADIUS, aspect);
      mesh.userData.baseWidth = extent.width;
      mesh.userData.baseHeight = extent.height;

      mesh.userData.parked = isTeaser && i >= shown;
      mesh.userData.targetPop = mesh.userData.parked ? 0 : POP.rest;
    });
  }

  useImperativeHandle(ref, () => ({
    focusItem(id) {
      const mesh = meshesRef.current.find((m) => m.userData.item.id === id);
      if (mesh) focusMesh(mesh, false);
    },
    resetView() {
      clearFocus(false);
      homeRef.current = true;
    },
    releaseFocus() {
      clearFocus(false);
    },
    zoom(direction) {
      if (focusedRef.current) return;
      targetDistRef.current = THREE.MathUtils.clamp(targetDistRef.current + direction * 1.1, DIST.min, DIST.max);
    },
    setFilter(ids) {
      meshesRef.current.forEach((m) => {
        m.userData.filtered = Boolean(ids) && !ids!.has(m.userData.item.id);
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
    homeRef.current = false;
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
    const gap = Math.max(mesh.userData.baseWidth, mesh.userData.baseHeight) * FOCUS_GAP;
    camGoalRef.current = world.clone().addScaledVector(outward, gap);
    targetGoalRef.current = world.clone();

    meshesRef.current.forEach((m) => {
      m.userData.targetPop = m.userData.parked ? 0 : m === mesh ? POP.focus : POP.rest;
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
      m.userData.targetPop = m.userData.parked ? 0 : POP.rest;
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
        baseWidth: 0.2,
        baseHeight: 0.2,
        targetPop: POP.rest,
        pop: 0,
        parked: false,
        filtered: false,
        revealOpacity: 0,
      };
      mesh.scale.set(0.001, 0.001, 1);
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
        return !plate.userData.parked && plate.material.opacity > 0.35;
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
        m.userData.targetPop = m === mesh ? POP.hover : POP.rest;
      });

      canvas.style.cursor = mesh ? 'pointer' : 'grab';
      onHoverRef.current?.(
        mesh ? mesh.userData.item : null,
        mesh ? { x: event.clientX, y: event.clientY } : undefined,
      );
    }

    function onPointerDown(event: PointerEvent) {
      // Taking hold of the sphere cancels a reset glide: the visitor is steering.
      homeRef.current = false;
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
        m.userData.targetPop = POP.rest;
      });
      onHoverRef.current?.(null);
    }

    function onWheel(event: WheelEvent) {
      if (embeddedRef.current || modeRef.current === 'teaser' || focusedRef.current) return;
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
    // The front view the globe opens on, and the scratch rotations for gliding to it.
    const home = new THREE.Vector3(0, 0, 1);
    const homeTurn = new THREE.Quaternion();
    const homeStep = new THREE.Quaternion();

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

        // Reset: swing the camera round toward the front view along the shortest
        // arc, a fraction per frame like the distance. Close enough counts as
        // arrived (auto-rotate keeps nudging it, so it would never land exactly),
        // and the last stretch snaps so the view is the same every time.
        if (homeRef.current) {
          if (scratchDir.dot(home) > 0.9995) {
            scratchDir.copy(home);
            homeRef.current = false;
          } else {
            homeTurn.setFromUnitVectors(scratchDir, home);
            homeStep.identity().slerp(homeTurn, EASE.distance);
            scratchDir.applyQuaternion(homeStep);
          }
        }
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

        // Pop is tracked separately from the mesh scale because the scale is now
        // non-uniform: lerping mesh.scale.x toward a width would silently squash
        // every plate to its own aspect twice over.
        data.pop = THREE.MathUtils.lerp(data.pop, data.targetPop, EASE.scale);
        const scale = data.pop;
        mesh.scale.set(data.baseWidth * scale, data.baseHeight * scale, 1);

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
          touchAction: embedded ? 'pan-y' : 'none',
          // In teaser mode the surrounding button owns the interaction.
          pointerEvents: mode === 'full' ? 'auto' : 'none',
        }}
        aria-hidden
      />
    </div>
  );
});

export default GlobeCanvas;

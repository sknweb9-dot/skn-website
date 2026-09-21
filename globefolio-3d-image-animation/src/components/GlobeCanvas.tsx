import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PortfolioItem, GlobeConfig, GlobeShape } from '../types';
import {
  PORTFOLIO_ITEMS,
  TOTAL_COUNT,
  calculateItemTransform,
  createFallbackCanvas
} from '../data/portfolioData';
import { soundFx } from '../utils/audio';

export interface GlobeCanvasHandle {
  focusItem: (id: number) => void;
  resetZoom: () => void;
  setScrollProgress: (progress: number) => void;
}

interface GlobeCanvasProps {
  config: GlobeConfig;
  activeItem: PortfolioItem | null;
  onHoverItem: (item: PortfolioItem | null, screenPos?: { x: number; y: number }) => void;
  onSelectItem: (item: PortfolioItem | null) => void;
  isZoomed: boolean;
  viewMode: 'globe' | 'story';
}

interface MeshData extends THREE.Mesh {
  userData: {
    item: PortfolioItem;
    originalPos: THREE.Vector3;
    originalLookAt: THREE.Vector3;
    targetPos: THREE.Vector3;
    targetRot: THREE.Euler;
    targetScale: number;
    baseOpacity: number;
    targetOpacity: number;
    index: number;
  };
}

export const GlobeCanvas = forwardRef<GlobeCanvasHandle, GlobeCanvasProps>(({
  config,
  activeItem,
  onHoverItem,
  onSelectItem,
  isZoomed,
  viewMode
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Internal Three.js state stored in refs to avoid re-instantiation
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshesRef = useRef<MeshData[]>([]);
  const animFrameRef = useRef<number>(0);

  // Interaction & Camera animation refs
  const targetDistanceRef = useRef<number>(0.5); // Starts inside at 0.5
  const savedCamPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 4));
  const savedTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const savedDistanceRef = useRef<number>(4);
  const isCameraZoomingRef = useRef<boolean>(false);
  const cameraGoalPosRef = useRef<THREE.Vector3 | null>(null);
  const controlsGoalTargetRef = useRef<THREE.Vector3 | null>(null);

  // Scroll rotation offset for Story mode
  const scrollOffsetRef = useRef<number>(0);

  // Active item & Zoom state ref for animation loop
  const isZoomedRef = useRef<boolean>(isZoomed);
  isZoomedRef.current = isZoomed;

  const activeItemRef = useRef<PortfolioItem | null>(activeItem);
  activeItemRef.current = activeItem;

  const configRef = useRef<GlobeConfig>(config);
  configRef.current = config;

  const viewModeRef = useRef<'globe' | 'story'>(viewMode);
  viewModeRef.current = viewMode;

  const onSelectItemRef = useRef(onSelectItem);
  onSelectItemRef.current = onSelectItem;

  const onHoverItemRef = useRef(onHoverItem);
  onHoverItemRef.current = onHoverItem;

  // Imperative handle for parent to trigger focus / zoom
  useImperativeHandle(ref, () => ({
    focusItem: (id: number) => {
      const mesh = meshesRef.current.find(m => m.userData.item.id === id);
      if (mesh) {
        // notifyParent = false to prevent mutual call stack overflow with parent state
        zoomToMesh(mesh, false);
      }
    },
    resetZoom: () => {
      // notifyParent = false to prevent mutual loop
      zoomOut(false);
    },
    setScrollProgress: (progress: number) => {
      scrollOffsetRef.current = progress;
    }
  }));

  function zoomToMesh(mesh: MeshData, notifyParent: boolean = true) {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    if (!isZoomedRef.current) {
      savedCamPosRef.current.copy(camera.position);
      savedTargetRef.current.copy(controls.target);
      savedDistanceRef.current = targetDistanceRef.current;
    }

    mesh.userData.targetScale = 1.25;
    controls.autoRotate = false;
    controls.enableRotate = false;

    const meshWorldPos = mesh.getWorldPosition(new THREE.Vector3());
    const dir = camera.position.clone().sub(controls.target).normalize();
    const zoomDist = 0.52; // close frame

    cameraGoalPosRef.current = new THREE.Vector3(
      meshWorldPos.x + dir.x * zoomDist,
      meshWorldPos.y + dir.y * zoomDist,
      meshWorldPos.z + dir.z * zoomDist
    );
    controlsGoalTargetRef.current = meshWorldPos.clone();
    isCameraZoomingRef.current = true;

    soundFx.playClick();
    if (notifyParent) {
      onSelectItemRef.current(mesh.userData.item);
    }
  }

  function zoomOut(notifyParent: boolean = true) {
    const controls = controlsRef.current;
    if (!controls) return;

    cameraGoalPosRef.current = savedCamPosRef.current.clone();
    controlsGoalTargetRef.current = savedTargetRef.current.clone();
    isCameraZoomingRef.current = true;

    // Reset scales
    meshesRef.current.forEach(m => {
      m.userData.targetScale = 1.0;
    });

    setTimeout(() => {
      if (controlsRef.current) {
        controlsRef.current.autoRotate = configRef.current.autoRotate;
        controlsRef.current.enableRotate = true;
      }
      targetDistanceRef.current = savedDistanceRef.current;
      if (notifyParent) {
        onSelectItemRef.current(null);
      }
    }, 800);
  }

  // Setup Three scene once
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // 1. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    // 2. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera starts inside at z = 0.5 per Junkerr
    const camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.01,
      1000
    );
    camera.position.set(0, 0, 0.5);
    cameraRef.current = camera;

    // 3. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = false; // Custom wheel zoom with smooth lerp
    controls.autoRotate = config.autoRotate;
    controls.autoRotateSpeed = config.autoRotateSpeed;
    controls.rotateSpeed = 0.35;
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.minDistance = 0.2;
    controls.maxDistance = 10;
    controlsRef.current = controls;

    // Subtle atmospheric ambient & point light for depth
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    // 4. Custom wheel zoom handling
    const handleWheel = (e: WheelEvent) => {
      // In Story mode, let normal document scroll occur unless hovering directly over canvas in globe mode
      if (viewMode === 'story') return;
      e.preventDefault();
      targetDistanceRef.current = THREE.MathUtils.clamp(
        targetDistanceRef.current + e.deltaY * 0.0035,
        controls.minDistance,
        controls.maxDistance
      );
    };
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    // 5. Build Fibonacci Globe Meshes
    const COUNT = TOTAL_COUNT;
    const R = config.radius;
    const Hgt = config.cardHeight;
    const Wth = Hgt * config.cardWidthRatio;
    const geometry = new THREE.PlaneGeometry(Wth, Hgt);

    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin('anonymous');

    const createdMeshes: MeshData[] = [];

    // Pre-load textures with fallback canvas
    PORTFOLIO_ITEMS.forEach((item, i) => {
      const transform = calculateItemTransform(i, COUNT, R, config.shape);

      // Create fallback canvas texture first (instant visual feedback)
      const fallbackCanvas = createFallbackCanvas(i, item.title, item.category);
      const fallbackTexture = new THREE.CanvasTexture(fallbackCanvas);
      fallbackTexture.colorSpace = THREE.SRGBColorSpace;

      const mat = new THREE.MeshBasicMaterial({
        map: fallbackTexture,
        transparent: true,
        opacity: 0, // Starts at 0, animated in
        side: THREE.DoubleSide
      });

      const mesh = new THREE.Mesh(geometry, mat) as unknown as MeshData;
      mesh.position.set(transform.position[0], transform.position[1], transform.position[2]);
      mesh.lookAt(new THREE.Vector3(
        transform.lookAtTarget[0],
        transform.lookAtTarget[1],
        transform.lookAtTarget[2]
      ));

      mesh.userData = {
        item,
        originalPos: mesh.position.clone(),
        originalLookAt: new THREE.Vector3(
          transform.lookAtTarget[0],
          transform.lookAtTarget[1],
          transform.lookAtTarget[2]
        ),
        targetPos: mesh.position.clone(),
        targetRot: mesh.rotation.clone(),
        targetScale: 1.0,
        baseOpacity: 1.0,
        targetOpacity: 1.0,
        index: i
      };

      scene.add(mesh);
      createdMeshes.push(mesh);

      // Asynchronously load real high-res Unsplash photo
      textureLoader.load(
        item.imageUrl,
        (loadedTex) => {
          loadedTex.colorSpace = THREE.SRGBColorSpace;
          const imgAspect = (loadedTex.image.width || 1) / (loadedTex.image.height || 1);
          const cardAspect = Wth / Hgt;
          let rx = 1, ry = 1, ox = 0, oy = 0;
          if (imgAspect > cardAspect) {
            rx = cardAspect / imgAspect;
            ox = (1 - rx) / 2;
          } else {
            ry = imgAspect / cardAspect;
            oy = (1 - ry) / 2;
          }
          loadedTex.wrapS = THREE.ClampToEdgeWrapping;
          loadedTex.wrapT = THREE.ClampToEdgeWrapping;
          loadedTex.repeat.set(rx, ry);
          loadedTex.offset.set(ox, oy);
          loadedTex.generateMipmaps = true;
          loadedTex.minFilter = THREE.LinearMipMapLinearFilter;
          loadedTex.magFilter = THREE.LinearFilter;
          mat.map = loadedTex;
          mat.needsUpdate = true;
        },
        undefined,
        () => {
          // Keep crisp fallback canvas on network error
        }
      );
    });

    meshesRef.current = createdMeshes;

    // 6. Staggered Entrance Animation (inside z=0.5 -> orbit d=4)
    let startTime = performance.now();
    const entranceDuration = 1800; // ms

    createdMeshes.forEach((m, idx) => {
      setTimeout(() => {
        m.userData.baseOpacity = 1.0;
      }, (idx / COUNT) * 600);
    });

    // Smooth camera zoom out to d = 4.0
    setTimeout(() => {
      const zoomStartTime = performance.now();
      const zoomDuration = 1600;
      const initialD = 0.5;
      const finalD = 3.9;

      const zoomInterval = setInterval(() => {
        const elapsed = performance.now() - zoomStartTime;
        const progress = Math.min(1, elapsed / zoomDuration);
        // easeInOutCubic
        const ease = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        targetDistanceRef.current = initialD + (finalD - initialD) * ease;
        if (progress >= 1) {
          clearInterval(zoomInterval);
        }
      }, 16);
    }, 400);

    // 7. Raycasting for hover & clicks
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let hoveredMesh: MeshData | null = null;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isZoomedRef.current) {
        onHoverItem(null);
        return;
      }

      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(meshesRef.current, false);

      if (hits.length > 0) {
        const hitMesh = hits[0].object as unknown as MeshData;
        if (hoveredMesh !== hitMesh) {
          hoveredMesh = hitMesh;
          soundFx.playHover();
          onHoverItem(hitMesh.userData.item, { x: e.clientX, y: e.clientY });
        }
        meshesRef.current.forEach(m => {
          m.userData.targetScale = m === hitMesh ? 1.25 : 1.0;
        });
      } else {
        if (hoveredMesh) {
          hoveredMesh = null;
          onHoverItem(null);
          meshesRef.current.forEach(m => {
            m.userData.targetScale = 1.0;
          });
        }
      }
    };

    const handlePointerLeave = () => {
      if (!isZoomedRef.current) {
        hoveredMesh = null;
        onHoverItem(null);
        meshesRef.current.forEach(m => {
          m.userData.targetScale = 1.0;
        });
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      // If already zoomed in, clicking anywhere or on a card toggles back out
      if (isZoomedRef.current) {
        zoomOut(true);
        return;
      }

      const rect = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(meshesRef.current, false);

      if (hits.length > 0) {
        const clickedMesh = hits[0].object as unknown as MeshData;
        zoomToMesh(clickedMesh, true);
      }
    };

    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerleave', handlePointerLeave);
    canvas.addEventListener('pointerdown', handlePointerDown);

    // 8. Animation Render Loop
    const reusableQuat = new THREE.Quaternion();
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      // Smooth camera interpolation for zoom in/out
      if (isCameraZoomingRef.current && cameraGoalPosRef.current && controlsGoalTargetRef.current) {
        camera.position.lerp(cameraGoalPosRef.current, 0.08);
        controls.target.lerp(controlsGoalTargetRef.current, 0.08);

        if (
          camera.position.distanceTo(cameraGoalPosRef.current) < 0.005 &&
          controls.target.distanceTo(controlsGoalTargetRef.current) < 0.005
        ) {
          camera.position.copy(cameraGoalPosRef.current);
          controls.target.copy(controlsGoalTargetRef.current);
          isCameraZoomingRef.current = false;
        }
      } else if (!isZoomedRef.current) {
        // Normal distance lerp towards targetDistance
        const dir = camera.position.clone().normalize();
        const currentDist = camera.position.length();
        const newDist = THREE.MathUtils.lerp(currentDist, targetDistanceRef.current, 0.08);
        camera.position.copy(dir.multiplyScalar(newDist));

        // In Story mode, apply subtle scroll influence to orientation
        if (viewModeRef.current === 'story') {
          const scrollProgress = scrollOffsetRef.current;
          scene.rotation.y = scrollProgress * Math.PI * 1.5;
          scene.rotation.x = Math.sin(scrollProgress * Math.PI) * 0.25;
        }
      }

      // Smooth scale, position, and opacity lerping for each mesh
      meshesRef.current.forEach(m => {
        // Scale lerp
        const currentScale = m.scale.x;
        const s = THREE.MathUtils.lerp(currentScale, m.userData.targetScale, 0.15);
        m.scale.set(s, s, s);

        // Position morphing when shape changes
        if (m.position.distanceTo(m.userData.targetPos) > 0.001) {
          m.position.lerp(m.userData.targetPos, 0.08);
        }

        // Rotation morphing
        reusableQuat.setFromEuler(m.userData.targetRot);
        m.quaternion.slerp(reusableQuat, 0.08);

        // Opacity lerp
        const mat = m.material as THREE.MeshBasicMaterial;
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, m.userData.targetOpacity, 0.1);
      });

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize Handling
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  // Update controls auto-rotate & speeds when config changes
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = config.autoRotate && !isZoomed;
      controlsRef.current.autoRotateSpeed = config.autoRotateSpeed;
    }
  }, [config.autoRotate, config.autoRotateSpeed, isZoomed]);

  // Update Category Filtering Opacity
  useEffect(() => {
    meshesRef.current.forEach(m => {
      const match = config.selectedCategory === 'All' || m.userData.item.category === config.selectedCategory;
      m.userData.targetOpacity = match ? 1.0 : 0.15;
    });
  }, [config.selectedCategory]);

  // Update Shape Layout (Sphere vs Spiral vs Cylinder)
  useEffect(() => {
    const dummy = new THREE.Object3D();
    meshesRef.current.forEach((m, idx) => {
      const t = calculateItemTransform(idx, TOTAL_COUNT, config.radius, config.shape);
      m.userData.targetPos.set(t.position[0], t.position[1], t.position[2]);

      dummy.position.set(t.position[0], t.position[1], t.position[2]);
      dummy.lookAt(t.lookAtTarget[0], t.lookAtTarget[1], t.lookAtTarget[2]);
      m.userData.targetRot.copy(dummy.rotation);
    });
  }, [config.shape, config.radius]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none bg-radial from-[#13151c] via-[#0b0c10] to-[#050608]"
      style={{ touchAction: 'none' }}
    >
      <canvas
        ref={canvasRef}
        id="globeCanvas"
        className="block w-full h-full cursor-grab active:cursor-grabbing outline-none"
      />
    </div>
  );
});

GlobeCanvas.displayName = 'GlobeCanvas';

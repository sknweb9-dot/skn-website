import type * as THREE from 'three';
import type { GlobeItem } from '@/lib/gallery';
import type { GlobeShape } from '@/lib/globe';

export type GlobeMode = 'teaser' | 'full';

export type GlobeHandle = {
  focusItem: (id: string) => void;
  /**
   * The Reset button: let go of any selected plate, bring the zoom back to its
   * resting distance, and glide the sphere round to the front view it opened on.
   * A drag or a new selection cancels the glide.
   */
  resetView: () => void;
  /**
   * Close a selected plate without touching where the sphere is turned: the
   * camera lets go of the plate and backs off to the resting distance from
   * wherever it happens to be looking.
   */
  releaseFocus: () => void;
  /** Draw closer (-1) or further away (1), for the plus and minus buttons. */
  zoom: (direction: 1 | -1) => void;
  /** The ids that stay lit; everything else dims. null clears the filter. */
  setFilter: (ids: ReadonlySet<string> | null) => void;
  setAutoRotate: (on: boolean) => void;
  setShape: (shape: GlobeShape) => void;
  /**
   * Re-run the camera-from-inside reveal. Called when the gallery is opened, so
   * the full-screen entrance is the same movement as the first one rather than
   * the sphere simply being larger.
   */
  replayReveal: () => void;
};

export type GlobeProps = {
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
  /**
   * On a page rather than in an overlay: the wheel and a vertical drag belong to
   * the page, so scrolling past the globe still scrolls. The globe turns on a
   * horizontal drag and a mouse drag, and zooms on the plus and minus buttons.
   */
  embedded?: boolean;
  className?: string;
};

export type PlateMesh = THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> & {
  userData: {
    item: GlobeItem;
    index: number;
    targetPos: THREE.Vector3;
    targetQuat: THREE.Quaternion;
    /**
     * Resting size in world units. Non-uniform, because every plate now carries
     * its image's own aspect ratio rather than being cropped to a square.
     */
    baseWidth: number;
    baseHeight: number;
    /** Multiplier over the base size: rest, hover or focus. */
    targetPop: number;
    pop: number;
    /** Beyond the teaser cut: present in the scene but not shown. */
    parked: boolean;
    /** Excluded by the current section filter. */
    filtered: boolean;
    revealOpacity: number;
  };
};

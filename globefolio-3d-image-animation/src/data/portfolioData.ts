import { PortfolioItem, GlobeShape } from '../types';

export const BASE_PHOTOS: Array<{
  url: string;
  title: string;
  category: PortfolioItem['category'];
  location: string;
  photographer: string;
  client: string;
  description: string;
}> = [
  {
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    title: 'Brutalist Pavilions',
    category: 'Architecture',
    location: 'Copenhagen, Denmark',
    photographer: 'Robin Schreiner',
    client: 'Danish Design Center',
    description: 'Minimalist concrete volumes exploring volumetric shadows and Scandinavian daylight balance.'
  },
  {
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    title: 'Monochrome Monolith',
    category: 'Architecture',
    location: 'Berlin, Germany',
    photographer: 'Lukas K.',
    client: 'Studio K3',
    description: 'Geometric facade composition emphasizing vertical rhythm and tectonic material integrity.'
  },
  {
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    title: 'Refractive Heights',
    category: 'Architecture',
    location: 'Tokyo, Japan',
    photographer: 'Kenji Sato',
    client: 'Mori Building Corp',
    description: 'High-altitude glass reflections fracturing metropolitan light at civil twilight.'
  },
  {
    url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
    title: 'Atelier Sartorial',
    category: 'Editorial',
    location: 'Milan, Italy',
    photographer: 'Elena Rossi',
    client: 'Vogue Italia Archive',
    description: 'Exploration of tailored drapery and textile tension in natural side-diffused studio lighting.'
  },
  {
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    title: 'Silicon Continuum',
    category: 'Technology',
    categoryAlt: 'Spatial',
    location: 'Zurich, Switzerland',
    photographer: 'Marc Weber',
    client: 'Quantum Core Labs',
    description: 'Macrophotography of multi-layered micro-optics and silicon wafer diffraction pathways.'
  } as any,
  {
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    title: 'Atmospheric Dispersion',
    category: 'Visual Art',
    location: 'Reykjavik, Iceland',
    photographer: 'Astrid Lind',
    client: 'Nordic Light Biennale',
    description: 'Gradated atmospheric spectrum captured through prism lenses at polar sunrise.'
  },
  {
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
    title: 'Nebula Genesis',
    category: 'Visual Art',
    location: 'Atacama, Chile',
    photographer: 'Carlos Mendez',
    client: 'Cosmic Array Foundation',
    description: 'Deep-sky astrophotography of interstellar ionized gas clouds and dark nebulae.'
  },
  {
    url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    title: 'Chroma Sculpt',
    category: 'Branding',
    location: 'London, United Kingdom',
    photographer: 'Arthur Pendelton',
    client: 'Serpentine Editions',
    description: 'Generative chromatic gradients mapped across physical 3D-milled aluminum castings.'
  },
  {
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    title: 'Glacial Basin',
    category: 'Spatial',
    location: 'Yosemite, California',
    photographer: 'David Miller',
    client: 'Wilderness Spatial Lab',
    description: 'Topographical granite face emerging through morning thermals and pine mist.'
  },
  {
    url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=800&q=80',
    title: 'Granite Solitude',
    category: 'Spatial',
    location: 'Zermatt, Switzerland',
    photographer: 'Beatrix von Berg',
    client: 'Alpine Heritage',
    description: 'High alpine ridge contour lines delineated by seasonal wind-driven snowdrifts.'
  },
  {
    url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80',
    title: 'Peak Luminescence',
    category: 'Editorial',
    location: 'Banff, Canada',
    photographer: 'Liam O’Connor',
    client: 'National Geographic',
    description: 'Clear starlight reflecting over glaciated peaks with zero ambient light pollution.'
  },
  {
    url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80',
    title: 'Ephemeral Silhouette',
    category: 'Editorial',
    location: 'Paris, France',
    photographer: 'Claire Delacroix',
    client: 'Maison de la Photographie',
    description: 'Low-key portrait study capturing contemplative expression and rim lighting nuances.'
  },
  {
    url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
    title: 'Valley Thermal Drift',
    category: 'Spatial',
    location: 'Dolomites, Italy',
    photographer: 'Matteo V.',
    client: 'South Tyrol Archive',
    description: 'Morning low-inversion clouds weaving between jagged limestone pinnacles.'
  },
  {
    url: 'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?auto=format&fit=crop&w=800&q=80',
    title: 'Prismatic Dispersion',
    category: 'Visual Art',
    location: 'Oslo, Norway',
    photographer: 'Henrik Solberg',
    client: 'Aker Brygge Gallery',
    description: 'Refracted multi-wavelength spectrum interacting with synthetic diamond films.'
  },
  {
    url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=80',
    title: 'Fluorescent Flow',
    category: 'Branding',
    location: 'Amsterdam, Netherlands',
    photographer: 'Sanne de Jong',
    client: 'Stedelijk Kinetic Lab',
    description: 'Viscous color fluids photographed at microsecond shutter speeds during laminar mixing.'
  },
  {
    url: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=800&q=80',
    title: 'Fjord Horizon',
    category: 'Architecture',
    location: 'Bergen, Norway',
    photographer: 'Eivind Dahl',
    client: 'Nordic Architectural Forum',
    description: 'Timber cantilever residence projecting 18 meters over calm glacial fjord water.'
  }
];

// Normalize categories into the 5 primary groups
const VALID_CATEGORIES: PortfolioItem['category'][] = ['Architecture', 'Editorial', 'Branding', 'Visual Art', 'Spatial'];

// Generate exactly 120 items matching Junkerr COUNT = 120
export const TOTAL_COUNT = 120;

export function generatePortfolioItems(count = TOTAL_COUNT): PortfolioItem[] {
  const items: PortfolioItem[] = [];
  const years = ['2023', '2024', '2025', '2026'];

  for (let i = 0; i < count; i++) {
    const base = BASE_PHOTOS[i % BASE_PHOTOS.length];
    const cat = VALID_CATEGORIES[i % VALID_CATEGORIES.length];
    const year = years[i % years.length];

    items.push({
      id: i + 1,
      title: `${base.title} #${String(i + 1).padStart(3, '0')}`,
      category: cat,
      year,
      client: base.client,
      photographer: base.photographer,
      location: base.location,
      imageUrl: base.url,
      description: base.description
    });
  }

  return items;
}

export const PORTFOLIO_ITEMS = generatePortfolioItems(TOTAL_COUNT);

/**
 * Calculates 3D position & normal vector for a given index and shape layout
 */
export function calculateItemTransform(
  index: number,
  total: number,
  radius: number,
  shape: GlobeShape = 'sphere'
): { position: [number, number, number]; lookAtTarget: [number, number, number] } {
  if (shape === 'sphere') {
    // Exact Fibonacci Golden Ratio spherical distribution
    const phi = Math.PI * (3 - Math.sqrt(5)); // ~2.399963 rad (137.5 deg)
    const v = (index + 0.5) / total;
    const th = phi * index;
    const z = 1 - 2 * v;
    const r0 = Math.sqrt(Math.max(0, 1 - z * z));
    const fx = Math.cos(th) * r0 * radius;
    const fy = z * radius;
    const fz = Math.sin(th) * r0 * radius;

    return {
      position: [fx, fy, fz],
      lookAtTarget: [fx * 2, fy * 2, fz * 2]
    };
  }

  if (shape === 'spiral') {
    // Elegant Double DNA Helix / Spiral Tower
    const height = 2.8;
    const turns = 4.5;
    const t = (index / total) * 2 * Math.PI * turns;
    const y = ((index / total) - 0.5) * height;
    const r = radius * 0.9;
    const x = Math.cos(t) * r;
    const z = Math.sin(t) * r;

    return {
      position: [x, y, z],
      lookAtTarget: [x * 2, y, z * 2]
    };
  }

  // shape === 'cylinder' / ring band
  const rows = 6;
  const itemsPerRow = Math.ceil(total / rows);
  const row = Math.floor(index / itemsPerRow);
  const col = index % itemsPerRow;
  const theta = (col / itemsPerRow) * Math.PI * 2;
  const y = (row - (rows - 1) / 2) * 0.38;
  const r = radius * 1.05;
  const x = Math.cos(theta) * r;
  const z = Math.sin(theta) * r;

  return {
    position: [x, y, z],
    lookAtTarget: [x * 2, y, z * 2]
  };
}

/**
 * Creates a high-contrast elegant fallback canvas texture
 */
export function createFallbackCanvas(index: number, title: string, category: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 428; // ~0.7 aspect ratio
  const ctx = canvas.getContext('2d')!;

  const hues = [220, 260, 320, 30, 160];
  const hue = hues[index % hues.length];

  // Subtle dark gradient background
  const grad = ctx.createLinearGradient(0, 0, 300, 428);
  grad.addColorStop(0, `hsl(${hue}, 25%, 16%)`);
  grad.addColorStop(1, `hsl(${hue + 20}, 30%, 8%)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 300, 428);

  // Border outline
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, 280, 408);

  // Elegant typographic placeholder
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '600 12px sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText(category.toUpperCase(), 24, 40);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = '700 24px sans-serif';
  ctx.fillText(`#${String(index + 1).padStart(3, '0')}`, 24, 75);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '400 14px sans-serif';
  const cleanTitle = title.length > 18 ? title.slice(0, 18) + '...' : title;
  ctx.fillText(cleanTitle, 24, 380);

  // Geometric icon in center
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.beginPath();
  ctx.arc(150, 214, 40, 0, Math.PI * 2);
  ctx.stroke();

  return canvas;
}

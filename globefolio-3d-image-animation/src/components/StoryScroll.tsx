import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowUpRight, Sparkles, Orbit, Compass, Eye, Filter, ArrowDown } from 'lucide-react';
import { PortfolioItem } from '../types';
import { PORTFOLIO_ITEMS, BASE_PHOTOS } from '../data/portfolioData';
import { soundFx } from '../utils/audio';

interface StoryScrollProps {
  onSelectItem: (item: PortfolioItem) => void;
  onScrollProgress?: (progress: number) => void;
}

export const StoryScroll: React.FC<StoryScrollProps> = ({
  onSelectItem,
  onScrollProgress
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  });

  // Report scroll progress to parent for 3D Globe camera choreography
  useEffect(() => {
    return scrollYProgress.on('change', (latest) => {
      onScrollProgress?.(latest);
    });
  }, [scrollYProgress, onScrollProgress]);

  // Parallax offsets for floating imagery
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);
  const parallaxFast = useTransform(scrollYProgress, [0.1, 0.8], [60, -140]);
  const parallaxSlow = useTransform(scrollYProgress, [0.1, 0.8], [-40, 80]);

  const featuredItems = PORTFOLIO_ITEMS.slice(0, 6);

  const filteredItems = PORTFOLIO_ITEMS.filter(item => {
    const matchesCategory = activeCategoryFilter === 'All' || item.category === activeCategoryFilter;
    const matchesSearch = searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.photographer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div ref={containerRef} className="relative w-full text-white pointer-events-auto">
      {/* ─── SECTION 1: HERO SCROLL OVERLAY ────────────────────────── */}
      <section className="relative min-h-[90vh] flex flex-col justify-end px-6 sm:px-12 pb-24 max-w-7xl mx-auto">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-mono tracking-widest text-white/80 uppercase">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Interactive Spatial Archive</span>
          </div>

          <h2 className="text-4xl sm:text-6xl md:text-7xl font-extrabold font-display tracking-tight leading-[1.05] text-white">
            120 Works in <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/40">
              Harmonic Orbit.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-white/70 max-w-xl font-light leading-relaxed">
            Inspired by the Junkerr 007 Globefolio design. An interconnected Fibonacci spherical gallery
            mapping contemporary architecture, spatial arts, and visual culture onto an interactive 3D canvas.
          </p>

          <div className="flex items-center gap-4 pt-4">
            <div className="flex items-center gap-2 text-xs font-mono text-white/50">
              <ArrowDown className="w-4 h-4 animate-bounce" />
              <span>Scroll to explore narrative & index</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─── SECTION 2: PARALLAX CURATED CASE STUDIES ─────────────── */}
      <section className="relative py-28 px-6 sm:px-12 max-w-7xl mx-auto border-t border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-16 gap-6">
          <div>
            <span className="text-xs font-mono tracking-widest uppercase text-emerald-400 block mb-2">
              01 // Curated Highlights
            </span>
            <h3 className="text-3xl sm:text-4xl font-bold font-display tracking-tight">
              Selected Perspectives
            </h3>
          </div>
          <p className="text-sm text-white/60 max-w-md font-mono">
            Each photographic plate is anchored to a unique spherical vector derived from the Golden Angle.
            Click any plate to inspect in full 3D zoom.
          </p>
        </div>

        {/* Dynamic Parallax Cards Grid with staggered data-speed emulation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredItems.map((item, idx) => {
            const isStaggered = idx % 2 === 1;
            return (
              <motion.div
                key={item.id}
                style={{ y: isStaggered ? parallaxSlow : parallaxFast }}
                className="group relative bg-[#13151c]/70 backdrop-blur-md border border-white/10 hover:border-white/30 rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-2xl cursor-pointer"
                onClick={() => {
                  soundFx.playClick();
                  onSelectItem(item);
                }}
              >
                {/* Image Container with Hover Zoom */}
                <div className="relative aspect-[3/4] overflow-hidden bg-black/40">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c10] via-transparent to-transparent opacity-80" />

                  {/* Top Badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-black/60 backdrop-blur-md border border-white/15 text-white">
                      PLATE #{String(item.id).padStart(3, '0')}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-white/80 backdrop-blur-md">
                      {item.category}
                    </span>
                  </div>

                  {/* Hover Floating Action Icon */}
                  <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowUpRight className="w-4 h-4 text-white" />
                  </div>
                </div>

                {/* Content info */}
                <div className="p-5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-white/50">
                    <span>{item.location}</span>
                    <span>{item.year}</span>
                  </div>

                  <h4 className="text-lg font-bold font-display text-white group-hover:text-emerald-300 transition-colors">
                    {item.title}
                  </h4>

                  <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-white/70">
                    <span>By {item.photographer}</span>
                    <span className="text-emerald-400 group-hover:underline flex items-center gap-1">
                      <span>View in 3D</span>
                      <Orbit className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ─── SECTION 3: MATHEMATICAL LATTICE BREAKDOWN ───────────── */}
      <section className="relative py-24 px-6 sm:px-12 max-w-7xl mx-auto border-t border-white/10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-mono tracking-widest uppercase text-emerald-400 block">
              02 // Mathematical Morphology
            </span>

            <h3 className="text-3xl sm:text-5xl font-bold font-display tracking-tight leading-tight">
              Fibonacci Spiral Spherical Projection
            </h3>

            <p className="text-sm sm:text-base text-white/70 leading-relaxed font-light">
              To arrange 120 image plates symmetrically around a 3D sphere without clustering at the poles,
              the layout calculates uniform density using the golden angle (<span className="font-mono text-white font-semibold">φ = π · (3 - √5) ≈ 137.508°</span>).
            </p>

            <div className="grid grid-cols-2 gap-4 font-mono text-xs pt-2">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <span className="text-white/40 block text-[10px]">SPHERE RADIUS</span>
                <span className="text-lg font-bold text-white">1.25 Units</span>
                <span className="text-[10px] text-white/50 block mt-1">Normalized WebGL scale</span>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <span className="text-white/40 block text-[10px]">GOLDEN ANGLE</span>
                <span className="text-lg font-bold text-emerald-400">2.39996 rad</span>
                <span className="text-[10px] text-white/50 block mt-1">137.50776° step</span>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <span className="text-white/40 block text-[10px]">CARD RATIO</span>
                <span className="text-lg font-bold text-white">0.70 : 1.0</span>
                <span className="text-[10px] text-white/50 block mt-1">Cover texture mapping</span>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <span className="text-white/40 block text-[10px]">TOTAL ARTIFACTS</span>
                <span className="text-lg font-bold text-white">120 Plates</span>
                <span className="text-[10px] text-white/50 block mt-1">Zero pole distortion</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 p-8 rounded-2xl bg-[#13151c]/90 border border-white/15 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 font-mono text-[10px] text-white/30">
              ALGORITHM ARCHIVE
            </div>

            <pre className="font-mono text-xs sm:text-[13px] text-white/80 overflow-x-auto p-4 rounded-lg bg-black/50 border border-white/10 leading-relaxed">
{`// Fibonacci Spherical Distribution
const phi = Math.PI * (3 - Math.sqrt(5));
for (let i = 0; i < COUNT; i++) {
  const v  = (i + 0.5) / COUNT;
  const th = phi * i;
  const z  = 1 - 2 * v;
  const r0 = Math.sqrt(1 - z * z);
  
  const fx = Math.cos(th) * r0 * R;
  const fy = z * R;
  const fz = Math.sin(th) * r0 * R;
  
  mesh.position.set(fx, fy, fz);
  mesh.lookAt(fx * 2, fy * 2, fz * 2);
}`}
            </pre>

            <p className="mt-4 text-xs text-white/50 font-mono">
              Each mesh's normal vector radiates outward from the sphere center, ensuring correct angle of incidence as OrbitControls rotates.
            </p>
          </div>
        </div>
      </section>

      {/* ─── SECTION 4: COMPLETE 120-ITEM DIRECTORY INDEX ─────────── */}
      <section className="relative py-24 px-6 sm:px-12 max-w-7xl mx-auto border-t border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-mono tracking-widest uppercase text-emerald-400 block mb-2">
              03 // Index & Directory
            </span>
            <h3 className="text-3xl sm:text-4xl font-bold font-display tracking-tight">
              Spatial Directory ({filteredItems.length})
            </h3>
          </div>

          {/* Search bar & filter pills */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Search title, artist, place..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-white/40 w-48 sm:w-64"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6">
          {['All', 'Architecture', 'Editorial', 'Branding', 'Visual Art', 'Spatial'].map(cat => (
            <button
              key={cat}
              onClick={() => {
                soundFx.playClick();
                setActiveCategoryFilter(cat);
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeCategoryFilter === cat
                  ? 'bg-white text-black font-semibold'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Directory Table / Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.slice(0, 24).map(item => (
            <div
              key={item.id}
              onClick={() => {
                soundFx.playClick();
                onSelectItem(item);
              }}
              className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/40 flex-shrink-0">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-white/50">
                  <span>#{String(item.id).padStart(3, '0')}</span>
                  <span>{item.category}</span>
                </div>
                <h5 className="text-xs font-bold text-white truncate group-hover:text-emerald-300">
                  {item.title}
                </h5>
                <p className="text-[11px] text-white/40 truncate">
                  {item.photographer} · {item.location}
                </p>
              </div>

              <ArrowUpRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
            </div>
          ))}
        </div>

        {filteredItems.length > 24 && (
          <p className="text-center text-xs font-mono text-white/40 mt-8">
            Displaying first 24 of {filteredItems.length} plates. Switch to 3D Globe to orbit all 120 works interactively.
          </p>
        )}
      </section>

      {/* ─── SECTION 5: FOOTER & COLOPHON ─────────────────────────── */}
      <footer className="py-16 px-6 sm:px-12 max-w-7xl mx-auto border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6 font-mono text-xs text-white/50">
        <div>
          <span className="font-bold text-white uppercase tracking-wider">007 GLOBEFOLIO</span>
          <span className="mx-2">·</span>
          <span>Crafted after junkerr.dk/007-globefolio-image-animation</span>
        </div>

        <div className="flex items-center gap-6">
          <span>Three.js WebGL</span>
          <span>Fibonacci Lattice</span>
          <span>Lenis Smooth Scroll</span>
          <span>React 19</span>
        </div>
      </footer>
    </div>
  );
};

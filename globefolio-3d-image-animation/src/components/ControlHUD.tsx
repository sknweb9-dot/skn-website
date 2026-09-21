import React from 'react';
import { Play, Pause, RotateCcw, Layers, Compass, HelpCircle } from 'lucide-react';
import { Category, GlobeConfig, GlobeShape } from '../types';
import { soundFx } from '../utils/audio';

interface ControlHUDProps {
  config: GlobeConfig;
  onChangeConfig: (newConfig: Partial<GlobeConfig>) => void;
  onResetZoom: () => void;
  isZoomed: boolean;
  viewMode: 'globe' | 'story';
}

const CATEGORIES: Category[] = [
  'All',
  'Architecture',
  'Editorial',
  'Branding',
  'Visual Art',
  'Spatial'
];

const SHAPES: { id: GlobeShape; label: string }[] = [
  { id: 'sphere', label: 'Sphere' },
  { id: 'spiral', label: 'Spiral' },
  { id: 'cylinder', label: 'Ring' }
];

export const ControlHUD: React.FC<ControlHUDProps> = ({
  config,
  onChangeConfig,
  onResetZoom,
  isZoomed,
  viewMode
}) => {
  // If in story mode or zoomed in, HUD can be more compact or dock
  return (
    <aside aria-label="Globe view controls" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-3xl pointer-events-none flex flex-col items-center gap-3">
      {/* Interaction Hint Pill */}
      {!isZoomed && viewMode === 'globe' && (
        <div className="pointer-events-auto px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/60 font-mono text-[11px] flex items-center gap-2 shadow-lg transition-all animate-fade-in">
          <HelpCircle className="w-3.5 h-3.5 text-white/50" />
          <span>DRAG TO ORBIT · SCROLL TO ZOOM · CLICK ANY PLATE TO INSPECT</span>
        </div>
      )}

      {/* Main Glass Control Dock */}
      <div className="pointer-events-auto w-full bg-[#13151c]/85 backdrop-blur-2xl border border-white/15 p-2 sm:p-2.5 rounded-2xl sm:rounded-full shadow-2xl flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-4">
        {/* Left: Category Filters */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 max-w-full sm:max-w-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              id={`filter-${cat.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => {
                soundFx.playClick();
                onChangeConfig({ selectedCategory: cat });
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                config.selectedCategory === cat
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-white/65 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-6 bg-white/15" />

        {/* Right: Shape selector & Play/Pause */}
        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
          {/* Shape selector */}
          <div className="flex items-center bg-white/5 p-1 rounded-full border border-white/10">
            {SHAPES.map(s => (
              <button
                key={s.id}
                id={`shape-${s.id}`}
                onClick={() => {
                  soundFx.playClick();
                  onChangeConfig({ shape: s.id });
                }}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                  config.shape === s.id
                    ? 'bg-white/20 text-white font-semibold'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Auto rotate toggle */}
          <button
            id="btn-toggle-rotate"
            onClick={() => {
              soundFx.playClick();
              onChangeConfig({ autoRotate: !config.autoRotate });
            }}
            title={config.autoRotate ? 'Pause Rotation' : 'Resume Auto Rotation'}
            className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
              config.autoRotate
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
            }`}
          >
            {config.autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>

          {/* Reset camera zoom */}
          <button
            id="btn-reset-view"
            onClick={() => {
              soundFx.playClick();
              onResetZoom();
            }}
            title="Reset Perspective"
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

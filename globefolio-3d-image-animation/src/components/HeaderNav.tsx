import React, { useState, useEffect } from 'react';
import { Globe, BookOpen, Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface HeaderNavProps {
  viewMode: 'globe' | 'story';
  onToggleViewMode: (mode: 'globe' | 'story') => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  totalCards: number;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  viewMode,
  onToggleViewMode,
  audioEnabled,
  onToggleAudio,
  totalCards
}) => {
  const [cphTime, setCphTime] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      try {
        const timeStr = new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Europe/Copenhagen',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).format(new Date());
        setCphTime(timeStr);
      } catch {
        setCphTime(new Date().toLocaleTimeString());
      }
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleFullscreenToggle = () => {
    soundFx.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full z-40 px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between pointer-events-none transition-all duration-300">
      {/* Left: Brand & Coordinates */}
      <div className="flex items-center gap-4 pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border border-white/20 bg-white/5 backdrop-blur-md flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold tracking-wider uppercase font-display text-white">
                007 GLOBEFOLIO
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70 font-mono tracking-widest border border-white/10">
                PROTOTYPE
              </span>
            </div>
            <p className="text-[11px] text-white/50 font-mono hidden sm:block">
              CPH · 55.6761° N, 12.5683° E · {cphTime} CET
            </p>
          </div>
        </div>
      </div>

      {/* Center: View Mode Switcher */}
      <div className="pointer-events-auto bg-[#13151c]/80 backdrop-blur-xl border border-white/15 p-1 rounded-full shadow-2xl flex items-center">
        <button
          id="btn-view-globe"
          onClick={() => {
            soundFx.playClick();
            onToggleViewMode('globe');
          }}
          className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all ${
            viewMode === 'globe'
              ? 'bg-white text-black font-semibold shadow-md'
              : 'text-white/70 hover:text-white hover:bg-white/5'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>3D Globe</span>
        </button>

        <button
          id="btn-view-story"
          onClick={() => {
            soundFx.playClick();
            onToggleViewMode('story');
          }}
          className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all ${
            viewMode === 'story'
              ? 'bg-white text-black font-semibold shadow-md'
              : 'text-white/70 hover:text-white hover:bg-white/5'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Scroll Story</span>
        </button>
      </div>

      {/* Right: Sound & Stats */}
      <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
        <div className="hidden md:flex items-center px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-[11px] font-mono text-white/60">
          <span className="text-white font-semibold mr-1">{totalCards}</span> PLATES ACTIVE
        </div>

        <button
          id="btn-audio-toggle"
          onClick={onToggleAudio}
          title={audioEnabled ? 'Mute Audio' : 'Unmute Sound Effects'}
          className="w-9 h-9 rounded-full border border-white/15 bg-white/5 hover:bg-white/15 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white transition-colors"
        >
          {audioEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-white/50" />}
        </button>

        <button
          id="btn-fullscreen-toggle"
          onClick={handleFullscreenToggle}
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          className="hidden sm:flex w-9 h-9 rounded-full border border-white/15 bg-white/5 hover:bg-white/15 backdrop-blur-md items-center justify-center text-white/80 hover:text-white transition-colors"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};

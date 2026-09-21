/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Lenis from 'lenis';
import { GlobeCanvas, GlobeCanvasHandle } from './components/GlobeCanvas';
import { HeaderNav } from './components/HeaderNav';
import { ControlHUD } from './components/ControlHUD';
import { FloatingCursor } from './components/FloatingCursor';
import { ItemModal } from './components/ItemModal';
import { StoryScroll } from './components/StoryScroll';
import { PortfolioItem, GlobeConfig } from './types';
import { PORTFOLIO_ITEMS, TOTAL_COUNT } from './data/portfolioData';
import { soundFx } from './utils/audio';

export default function App() {
  const globeCanvasRef = useRef<GlobeCanvasHandle>(null);
  const lenisRef = useRef<Lenis | null>(null);

  // Globe configuration
  const [config, setConfig] = useState<GlobeConfig>({
    count: TOTAL_COUNT,
    radius: 1.25,
    cardHeight: 0.2,
    cardWidthRatio: 0.7,
    autoRotate: true,
    autoRotateSpeed: 0.3,
    shape: 'sphere',
    selectedCategory: 'All'
  });

  // Navigation & Interactive states
  const [viewMode, setViewMode] = useState<'globe' | 'story'>('globe');
  const [activeItem, setActiveItem] = useState<PortfolioItem | null>(null);
  const [hoveredItem, setHoveredItem] = useState<PortfolioItem | null>(null);
  const [screenPos, setScreenPos] = useState<{ x: number; y: number } | null>(null);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);

  // Initialize Lenis smooth scroll for Story mode
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
      syncTouch: false
    });
    lenisRef.current = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  // Sync Audio state with SoundEngine
  const handleToggleAudio = useCallback(() => {
    const next = !audioEnabled;
    setAudioEnabled(next);
    soundFx.enabled = next;
    if (next) soundFx.playClick();
  }, [audioEnabled]);

  // Handle configuration changes from HUD
  const handleUpdateConfig = useCallback((newConfig: Partial<GlobeConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  // When hovering on a 3D card
  const handleHoverItem = useCallback((item: PortfolioItem | null, pos?: { x: number; y: number }) => {
    setHoveredItem(item);
    if (pos) setScreenPos(pos);
  }, []);

  // When clicking a card on 3D Canvas (already focused by canvas raycaster)
  const handleSelectItem = useCallback((item: PortfolioItem | null) => {
    setActiveItem(item);
  }, []);

  // When clicking a card in StoryScroll / Directory (trigger camera focus onto the card)
  const handleSelectAndFocusItem = useCallback((item: PortfolioItem) => {
    setActiveItem(item);
    globeCanvasRef.current?.focusItem(item.id);
  }, []);

  // Reset zoom back to full orbit
  const handleResetZoom = useCallback(() => {
    globeCanvasRef.current?.resetZoom();
    setActiveItem(null);
  }, []);

  // Next / Previous plate cycling on the 3D globe
  const handleNextPlate = useCallback(() => {
    if (!activeItem) return;
    const currentIndex = PORTFOLIO_ITEMS.findIndex(p => p.id === activeItem.id);
    const nextIndex = (currentIndex + 1) % PORTFOLIO_ITEMS.length;
    const nextItem = PORTFOLIO_ITEMS[nextIndex];
    setActiveItem(nextItem);
    globeCanvasRef.current?.focusItem(nextItem.id);
  }, [activeItem]);

  const handlePrevPlate = useCallback(() => {
    if (!activeItem) return;
    const currentIndex = PORTFOLIO_ITEMS.findIndex(p => p.id === activeItem.id);
    const prevIndex = (currentIndex - 1 + PORTFOLIO_ITEMS.length) % PORTFOLIO_ITEMS.length;
    const prevItem = PORTFOLIO_ITEMS[prevIndex];
    setActiveItem(prevItem);
    globeCanvasRef.current?.focusItem(prevItem.id);
  }, [activeItem]);

  const handleScrollProgress = useCallback((prog: number) => {
    globeCanvasRef.current?.setScrollProgress(prog);
  }, []);

  // Switch between Globe-first and Story-first modes
  const handleToggleViewMode = useCallback((mode: 'globe' | 'story') => {
    setViewMode(mode);
    if (mode === 'globe') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0b0c10] text-white selection:bg-white selection:text-black overflow-x-hidden">
      {/* Fixed 3D Globe Canvas Layer */}
      <div
        className={`fixed inset-0 z-0 transition-opacity duration-700 ${
          viewMode === 'story' ? 'opacity-40 sm:opacity-55' : 'opacity-100'
        }`}
      >
        <GlobeCanvas
          ref={globeCanvasRef}
          config={config}
          activeItem={activeItem}
          onHoverItem={handleHoverItem}
          onSelectItem={handleSelectItem}
          isZoomed={activeItem !== null}
          viewMode={viewMode}
        />
      </div>

      {/* Floating Hover Label following cursor */}
      <FloatingCursor
        hoveredItem={hoveredItem}
        screenPos={screenPos}
        isZoomed={activeItem !== null}
      />

      {/* Persistent Minimalist Header */}
      <HeaderNav
        viewMode={viewMode}
        onToggleViewMode={handleToggleViewMode}
        audioEnabled={audioEnabled}
        onToggleAudio={handleToggleAudio}
        totalCards={TOTAL_COUNT}
      />

      {/* Floating Control HUD in Globe Mode */}
      <ControlHUD
        config={config}
        onChangeConfig={handleUpdateConfig}
        onResetZoom={handleResetZoom}
        isZoomed={activeItem !== null}
        viewMode={viewMode}
      />

      {/* Detailed Card Inspection Modal / Drawer */}
      <ItemModal
        item={activeItem}
        onClose={handleResetZoom}
        onNext={handleNextPlate}
        onPrev={handlePrevPlate}
      />

      {/* Scroll-Triggered Story Sections (active in Story mode or scrolled down) */}
      {viewMode === 'story' && (
        <div className="relative z-10 pt-16">
          <StoryScroll
            onSelectItem={handleSelectAndFocusItem}
            onScrollProgress={handleScrollProgress}
          />
        </div>
      )}
    </div>
  );
}

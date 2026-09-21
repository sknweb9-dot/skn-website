import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PortfolioItem } from '../types';

interface FloatingCursorProps {
  hoveredItem: PortfolioItem | null;
  screenPos: { x: number; y: number } | null;
  isZoomed: boolean;
}

export const FloatingCursor: React.FC<FloatingCursorProps> = ({
  hoveredItem,
  screenPos,
  isZoomed
}) => {
  if (isZoomed || !hoveredItem || !screenPos) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="hover-badge"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.85 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        style={{
          position: 'fixed',
          left: screenPos.x,
          top: screenPos.y,
          transform: 'translate(-50%, -140%)',
          pointerEvents: 'none',
          zIndex: 50
        }}
        className="flex flex-col items-center"
      >
        <div className="bg-[#0b0c10]/90 backdrop-blur-md border border-white/20 text-white px-3.5 py-1.5 rounded-full shadow-2xl flex items-center gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-[11px] font-semibold tracking-wider text-white uppercase">
            Click to View
          </span>
          <span className="text-white/40 text-[10px]">•</span>
          <span className="text-white/80 text-[11px] font-medium max-w-[140px] truncate">
            {hoveredItem.title}
          </span>
        </div>
        <div className="w-0.5 h-2 bg-white/40 mt-0.5" />
      </motion.div>
    </AnimatePresence>
  );
};

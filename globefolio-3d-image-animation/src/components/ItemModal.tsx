import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, ExternalLink, MapPin, User, Calendar, Briefcase } from 'lucide-react';
import { PortfolioItem } from '../types';
import { soundFx } from '../utils/audio';

interface ItemModalProps {
  item: PortfolioItem | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export const ItemModal: React.FC<ItemModalProps> = ({
  item,
  onClose,
  onNext,
  onPrev
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        onNext();
      } else if (e.key === 'ArrowLeft') {
        onPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev]);

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          key="item-inspector"
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 80 }}
          transition={{ type: 'spring', damping: 28, stiffness: 220 }}
          className="fixed top-20 right-4 sm:right-8 z-50 w-[92vw] sm:w-[420px] max-h-[calc(100vh-6.5rem)] overflow-y-auto bg-[#13151c]/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl p-5 sm:p-6 text-white flex flex-col gap-4"
        >
          {/* Header row: ID tag & Close button */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-white/50">PLATE</span>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white/10 text-white">
                #{String(item.id).padStart(3, '0')}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {item.category}
              </span>
            </div>

            <button
              id="btn-close-modal"
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              title="Return to Orbit (Esc)"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* High-res Image Preview */}
          <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-black/50 border border-white/10 group">
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
            <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/70 backdrop-blur-md text-[10px] font-mono text-white/70">
              3D Fibonacci Plane
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-2">
            <h2 className="text-xl font-bold font-display tracking-tight text-white">
              {item.title}
            </h2>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
              {item.description}
            </p>
          </div>

          {/* Metadata Specs Grid */}
          <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 text-xs font-mono">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-white/40" />
              <div>
                <span className="text-[10px] block text-white/40">LOCATION</span>
                <span className="text-white/90 truncate block">{item.location}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-white/40" />
              <div>
                <span className="text-[10px] block text-white/40">ARTIST</span>
                <span className="text-white/90 truncate block">{item.photographer}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5 text-white/40" />
              <div>
                <span className="text-[10px] block text-white/40">CLIENT</span>
                <span className="text-white/90 truncate block">{item.client}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-white/40" />
              <div>
                <span className="text-[10px] block text-white/40">YEAR</span>
                <span className="text-white/90 truncate block">{item.year}</span>
              </div>
            </div>
          </div>

          {/* Navigation controls: Prev / Next around the globe */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <div className="flex items-center gap-2">
              <button
                id="btn-prev-plate"
                onClick={() => {
                  soundFx.playClick();
                  onPrev();
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>
              <button
                id="btn-next-plate"
                onClick={() => {
                  soundFx.playClick();
                  onNext();
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              id="btn-orbit-return"
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="text-xs font-mono text-white/60 hover:text-white underline underline-offset-4 transition-colors"
            >
              Zoom Out to Orbit
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

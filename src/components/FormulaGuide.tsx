import { motion } from 'motion/react';
import { BookOpen, X } from 'lucide-react';

interface FormulaGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FormulaGuide({ isOpen, onClose }: FormulaGuideProps) {
  if (!isOpen) return null;

  return (
    <div id="formula-guide-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        id="formula-guide-modal-content"
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700/60 p-6 shadow-2xl text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
              <BookOpen size={20} />
            </div>
            <h2 className="text-xl font-bold tracking-tight font-sans">
              Transformation Reference Guide
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            aria-label="Close formula guide"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-6 text-sm font-sans">
          
          {/* Section 1: Translation */}
          <section className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-5 space-y-3">
            <h3 className="text-base font-bold text-emerald-400 font-sans tracking-tight">
              Translation
            </h3>
            <p className="text-slate-300 leading-relaxed">
              Translation means sliding a figure from one position to another. Every point moves the same distance and same direction. The figure does not turn or flip.
            </p>
            <div className="p-4 bg-slate-900/85 rounded-lg border border-slate-800 font-mono">
              <p className="text-center text-emerald-300 text-lg font-bold">
                Rule: (x,y) → (x+a, y+b)
              </p>
              <div className="mt-3 grid grid-cols-2 gap-4 text-xs text-slate-400 border-t border-slate-800/60 pt-3">
                <div className="space-y-1">
                  <p><strong>Where:</strong></p>
                  <p>a = horizontal movement</p>
                  <p>b = vertical movement</p>
                </div>
                <div className="space-y-1">
                  <p>Positive x → Right</p>
                  <p>Negative x → Left</p>
                  <p>Positive y → Up</p>
                  <p>Negative y → Down</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Reflection */}
          <section className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-5 space-y-3">
            <h3 className="text-base font-bold text-rose-400 font-sans tracking-tight">
              Reflection
            </h3>
            <p className="text-slate-300 leading-relaxed">
              Reflection creates a mirror image of a figure across a line called the line of reflection. The reflected figure is the same distance from the line as the original figure.
            </p>
            <div className="p-4 bg-slate-900/85 rounded-lg border border-slate-800 font-mono text-center space-y-2">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider text-left">Rule:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="p-2 bg-slate-950/40 border border-slate-800 rounded">
                  <span className="text-slate-400">Across the x-axis</span>
                  <p className="text-rose-300 font-bold mt-1">(x,y) → (x, -y)</p>
                </div>
                <div className="p-2 bg-slate-950/40 border border-slate-800 rounded">
                  <span className="text-slate-400">Across the y-axis</span>
                  <p className="text-rose-300 font-bold mt-1">(x,y) → (-x, y)</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Rotation */}
          <section className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-5 space-y-3">
            <h3 className="text-base font-bold text-yellow-400 font-sans tracking-tight">
              Rotation
            </h3>
            <p className="text-slate-300 leading-relaxed">
              Rotation is turning a figure around a fixed point called the center of rotation. In this lesson, rotations are about the origin (0,0).
            </p>
            <div className="p-4 bg-slate-900/85 rounded-lg border border-slate-800 font-mono space-y-2">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Rule:</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center p-2 bg-slate-950/40 border border-slate-800 rounded">
                  <span className="text-slate-400">90° Counterclockwise</span>
                  <span className="text-yellow-300 font-bold">(x,y) → (-y, x)</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-slate-950/40 border border-slate-800 rounded">
                  <span className="text-slate-400">90° Clockwise</span>
                  <span className="text-yellow-300 font-bold">(x,y) → (y, -x)</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-slate-950/40 border border-slate-800 rounded">
                  <span className="text-slate-400">180° Rotation</span>
                  <span className="text-yellow-300 font-bold">(x,y) → (-x, -y)</span>
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* Footer close button */}
        <div className="flex justify-end mt-6 border-t border-slate-800 pt-4">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl transition-colors shadow-lg shadow-indigo-600/25 cursor-pointer"
          >
            Got it, thanks!
          </button>
        </div>
      </motion.div>
    </div>
  );
}

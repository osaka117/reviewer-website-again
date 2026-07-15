/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Point, ProblemCategory, TransformationDetails } from './types';
import CartesianGrid from './components/CartesianGrid';
import ProblemGenerator from './components/ProblemGenerator';
import SandboxMode from './components/SandboxMode';
import FormulaGuide from './components/FormulaGuide';
import { Compass, BookOpen, Layers, Sparkles, Sliders } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface GridState {
  preImage: Point;
  image?: Point;
  userAnswer?: Point;
  transformation?: TransformationDetails;
  preImagePolygon?: Point[];
  imagePolygon?: Point[];
  activeVertexIndex?: number;
}

export default function App() {
  // Navigation Tab State
  const [activeTab, setActiveTab] = useState<'PRACTICE' | 'SANDBOX'>('PRACTICE');

  // Modal / Formula Guide State
  const [isFormulaGuideOpen, setIsFormulaGuideOpen] = useState<boolean>(false);

  // Separate Grid States for Practice and Sandbox to avoid cross-contamination
  const [practiceGridState, setPracticeGridState] = useState<GridState>({
    preImage: { x: 2, y: 3 },
  });

  const [sandboxGridState, setSandboxGridState] = useState<GridState>({
    preImage: { x: -3, y: 4 },
  });

  // Keep sandbox starting coordinates separate so dragging works perfectly
  const [sandboxPreImage, setSandboxPreImage] = useState<Point>({ x: -3, y: 4 });

  // Stable category for practice problems
  const [activePracticeCategory, setActivePracticeCategory] = useState<ProblemCategory | 'ALL'>('ALL');

  // Handle grid click (only active in Sandbox Mode)
  const handleGridClick = (clickedPoint: Point) => {
    if (activeTab === 'SANDBOX') {
      setSandboxPreImage(clickedPoint);
    }
  };

  // Get active grid state depending on active tab
  const currentGridState = activeTab === 'PRACTICE' ? practiceGridState : sandboxGridState;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Brand Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3.5 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          
          {/* Logo & Slogan */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-purple-500 rounded-2xl text-white shadow-lg shadow-indigo-600/15">
              <Compass size={22} className="animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-indigo-200 to-purple-200">
                Cartesian Plane Trainer
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium">
                Visual point positions, translations, reflections &amp; rotations
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFormulaGuideOpen(true)}
              id="header-formula-guide-btn"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-850 text-indigo-300 hover:text-indigo-200 border border-slate-800/80 hover:border-slate-700/80 cursor-pointer transition-all shadow-sm"
            >
              <BookOpen size={14} />
              Formula &amp; Study Guide
            </button>
          </div>

        </div>
      </header>

      {/* Main Workspace Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        
        {/* Upper Split Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Graph Visualizer (lg:col-span-6 or 5) */}
          <div className="lg:col-span-5 xl:col-span-5 space-y-4 lg:sticky lg:top-24">
            
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 shadow-lg flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-slate-950 text-indigo-400 rounded-lg">
                    <Layers size={14} />
                  </span>
                  <h2 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">
                    Interactive Grid (10 × 10)
                  </h2>
                </div>
                
                {activeTab === 'SANDBOX' && (
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
                    Interactive Drag / Click
                  </span>
                )}
              </div>

              {/* Cartesian Grid Canvas Canvas */}
              <CartesianGrid
                preImage={currentGridState.preImage}
                image={currentGridState.image}
                userAnswer={currentGridState.userAnswer}
                transformation={currentGridState.transformation}
                preImagePolygon={currentGridState.preImagePolygon}
                imagePolygon={currentGridState.imagePolygon}
                activeVertexIndex={currentGridState.activeVertexIndex}
                onGridClick={handleGridClick}
                interactive={activeTab === 'SANDBOX'}
              />

              {/* Grid Legend Panel */}
              <div id="grid-legend" className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/50 grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-white/20 inline-block"></span>
                  <span>Point P (Pre-image)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400 border border-white/20 inline-block"></span>
                  <span>Point P' (Image)</span>
                </div>
                <div className="flex items-center gap-1.5 col-span-2 pt-1 border-t border-slate-900">
                  <span className="text-red-400 font-bold">---</span>
                  <span>Line of Reflection</span>
                </div>
                <div className="flex items-center gap-1.5 col-span-2">
                  <span className="text-yellow-400 font-bold">↷</span>
                  <span>Rotation Angular Path</span>
                </div>
                {currentGridState.userAnswer && (
                  <div className="flex items-center gap-1.5 col-span-2 pt-1 border-t border-slate-900 text-amber-500">
                    <span className="font-bold">⌖</span>
                    <span>Your Answer Prediction</span>
                  </div>
                )}
              </div>

            </div>

            {/* Quick Tutorial Tip card based on active Mode */}
            <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-4 text-xs text-slate-400 space-y-1.5 leading-relaxed font-sans">
              <span className="font-bold text-slate-300 font-mono text-[10px] uppercase tracking-wider block">Trainer Tip</span>
              {activeTab === 'PRACTICE' ? (
                <p>
                  Solve the problem shown on the right panel, then enter the coordinate integers (e.g. <code className="font-mono bg-slate-900 px-1 py-0.5 rounded text-indigo-300">x</code> and <code className="font-mono bg-slate-900 px-1 py-0.5 rounded text-indigo-300">y</code>) or choose the location. The coordinate grid will animate and plot the starting pre-image point immediately to help you visualize, and then plot the transformation path once you check your solution!
                </p>
              ) : (
                <p>
                  In Sandbox Mode, you can click on any intersection on the grid to position point <code className="font-mono text-indigo-400">P</code>, select a custom math transformation, and input what you predict the coordinates will be. Click <strong>Verify Prediction</strong> to check your geometric logic!
                </p>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: Controls Panel (lg:col-span-6 or 7) */}
          <div className="lg:col-span-7 xl:col-span-7 space-y-5">
            
            {/* Mode Swapper Header Tabs */}
            <div className="flex bg-slate-900 border border-slate-800/80 rounded-2xl p-1.5">
              
              {/* Practice Questions Tab Button */}
              <button
                id="tab-btn-practice"
                onClick={() => setActiveTab('PRACTICE')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold cursor-pointer transition-all duration-200 ${
                  activeTab === 'PRACTICE'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/40'
                }`}
              >
                <Sparkles size={16} />
                Practice Questions
              </button>

              {/* Sandbox Tab Button */}
              <button
                id="tab-btn-sandbox"
                onClick={() => setActiveTab('SANDBOX')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold cursor-pointer transition-all duration-200 ${
                  activeTab === 'SANDBOX'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/40'
                }`}
              >
                <Sliders size={16} />
                Interactive Sandbox
              </button>

            </div>

            {/* Dynamic Panel Renderer with Micro-Animations */}
            <AnimatePresence mode="wait">
              {activeTab === 'PRACTICE' ? (
                <motion.div
                  key="practice-panel"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                >
                  <ProblemGenerator
                    onStateChange={setPracticeGridState}
                    activeCategory={activePracticeCategory}
                    setActiveCategory={setActivePracticeCategory}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="sandbox-panel"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                >
                  <SandboxMode
                    preImage={sandboxPreImage}
                    onPreImageChange={setSandboxPreImage}
                    onStateChange={setSandboxGridState}
                  />
                </motion.div>
              )}
            </AnimatePresence>

          </div>

        </div>

      </main>

      {/* Simple Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/60 py-5 text-center text-slate-500 text-xs font-mono">
        <div className="max-w-7xl mx-auto px-4">
          Cartesian Points &amp; Transformations Trainer • Multi-topic geometry trainer
        </div>
      </footer>

      {/* Formula Study Guide Dialog overlay */}
      <AnimatePresence>
        {isFormulaGuideOpen && (
          <FormulaGuide
            isOpen={isFormulaGuideOpen}
            onClose={() => setIsFormulaGuideOpen(false)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}

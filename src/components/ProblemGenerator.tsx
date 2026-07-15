import React, { useState, useEffect } from 'react';
import { Problem, ProblemCategory, Point } from '../types';
import { generateProblem } from '../utils/mathUtils';
import { HelpCircle, CheckCircle2, XCircle, ArrowRight, RotateCcw, Award, Sparkles, Sliders } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn("localStorage is not accessible:", e);
    return null;
  }
};

const safeSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn("localStorage is not accessible:", e);
  }
};

interface ProblemGeneratorProps {
  onStateChange: (state: {
    preImage: Point;
    image?: Point;
    userAnswer?: Point;
    transformation?: any;
    preImagePolygon?: Point[];
    imagePolygon?: Point[];
    activeVertexIndex?: number;
  }) => void;
  activeCategory: ProblemCategory | 'ALL';
  setActiveCategory: (cat: ProblemCategory | 'ALL') => void;
}

export default function ProblemGenerator({
  onStateChange,
  activeCategory,
  setActiveCategory,
}: ProblemGeneratorProps) {
  // Problem State
  const [problem, setProblem] = useState<Problem | null>(null);

  // Shape Mode Setting: 'POINT' | 'POLYGON' | 'RANDOM'
  const [shapeModeSetting, setShapeModeSetting] = useState<'POINT' | 'POLYGON' | 'RANDOM'>('POINT');
  
  // User Inputs (Point Mode)
  const [userX, setUserX] = useState<string>('');
  const [userY, setUserY] = useState<string>('');
  const [selectedQuadrant, setSelectedQuadrant] = useState<string>('');
  const [userNumeric, setUserNumeric] = useState<string>('');

  // User Inputs (Polygon Mode)
  const [polyInputs, setPolyInputs] = useState<Array<{ x: string; y: string }>>([]);

  // Status
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);

  // Statistics (persisted in LocalStorage)
  const [score, setScore] = useState<number>(() => {
    const saved = safeGetItem('cartesian_score');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [streak, setStreak] = useState<number>(() => {
    const saved = safeGetItem('cartesian_streak');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [total, setTotal] = useState<number>(() => {
    const saved = safeGetItem('cartesian_total');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Save stats to LocalStorage
  useEffect(() => {
    safeSetItem('cartesian_score', score.toString());
    safeSetItem('cartesian_streak', streak.toString());
    safeSetItem('cartesian_total', total.toString());
  }, [score, streak, total]);

  // Load new problem
  const loadNewProblem = (
    cat?: ProblemCategory | 'ALL',
    shapeSetting?: 'POINT' | 'POLYGON' | 'RANDOM'
  ) => {
    const targetCat = cat || activeCategory;
    const resolvedCat = targetCat === 'ALL' ? undefined : targetCat;
    const resolvedShape = shapeSetting || shapeModeSetting;

    const prob = generateProblem(resolvedCat, resolvedShape);
    setProblem(prob);
    
    // Clear inputs
    setUserX('');
    setUserY('');
    setSelectedQuadrant('');
    setUserNumeric('');
    const numVertices = prob.preImagePolygon ? prob.preImagePolygon.length : 0;
    setPolyInputs(Array.from({ length: numVertices }, () => ({ x: '', y: '' })));
    
    // Reset status
    setIsAnswered(false);
    setIsCorrect(false);
    setShowHint(false);

    // Communicate pre-image & polygon to parent
    onStateChange({
      preImage: prob.preImagePoint,
      image: undefined,
      userAnswer: undefined,
      transformation: undefined,
      preImagePolygon: prob.preImagePolygon,
      imagePolygon: undefined,
    });
  };

  // Load initial problem
  useEffect(() => {
    loadNewProblem();
  }, []);

  // Sync category change
  const handleCategoryChange = (cat: ProblemCategory | 'ALL') => {
    setActiveCategory(cat);
    loadNewProblem(cat, shapeModeSetting);
  };

  // Sync shape mode change
  const handleShapeModeChange = (mode: 'POINT' | 'POLYGON' | 'RANDOM') => {
    setShapeModeSetting(mode);
    loadNewProblem(activeCategory, mode);
  };

  // Show visual hint on the grid
  const handleToggleHint = () => {
    if (!problem) return;
    const newShowHint = !showHint;
    setShowHint(newShowHint);

    onStateChange({
      preImage: problem.preImagePoint,
      image: undefined,
      userAnswer: undefined,
      transformation: newShowHint ? problem.transformationDetails : undefined,
      preImagePolygon: problem.preImagePolygon,
      imagePolygon: undefined,
    });
  };

  // Check user's answer
  const handleCheckAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!problem || isAnswered) return;

    let correct = false;
    let uAnswerPoint: Point | undefined = undefined;

    if (problem.inputType === 'coordinate') {
      const parsedX = parseFloat(userX);
      const parsedY = parseFloat(userY);
      
      if (isNaN(parsedX) || isNaN(parsedY)) return;

      uAnswerPoint = { x: parsedX, y: parsedY };
      const target = problem.correctCoordinate;
      
      if (target) {
        correct = Math.abs(parsedX - target.x) < 0.01 && Math.abs(parsedY - target.y) < 0.01;
      }
    } else if (problem.inputType === 'polygon') {
      const target = problem.correctPolygon;
      if (target) {
        let allValid = true;
        let allCorrect = true;
        for (let i = 0; i < target.length; i++) {
          const input = polyInputs[i];
          if (!input) {
            allValid = false;
            break;
          }
          const px = parseFloat(input.x);
          const py = parseFloat(input.y);
          if (isNaN(px) || isNaN(py)) {
            allValid = false;
            break;
          }
          const isVertCorrect = Math.abs(px - target[i].x) < 0.01 && Math.abs(py - target[i].y) < 0.01;
          if (!isVertCorrect) {
            allCorrect = false;
          }
        }
        if (!allValid) return;
        correct = allCorrect;
      }
    } else if (problem.inputType === 'quadrant') {
      correct = selectedQuadrant === problem.correctQuadrant;
    } else if (problem.inputType === 'numeric') {
      const parsedNum = parseFloat(userNumeric);
      if (isNaN(parsedNum)) return;
      correct = Math.abs(parsedNum - (problem.correctNumeric ?? 0)) < 0.01;
    }

    setIsCorrect(correct);
    setIsAnswered(true);
    setTotal(prev => prev + 1);

    if (correct) {
      setScore(prev => prev + 1);
      setStreak(prev => prev + 1);
    } else {
      setStreak(0);
    }

    // Update coordinate grid with complete final visualization
    onStateChange({
      preImage: problem.preImagePoint,
      image: problem.imagePoint,
      userAnswer: uAnswerPoint,
      transformation: problem.transformationDetails,
      preImagePolygon: problem.preImagePolygon,
      imagePolygon: problem.imagePolygon,
    });
  };

  // Reset all statistics
  const handleResetStats = () => {
    if (confirm("Are you sure you want to reset your score and streak?")) {
      setScore(0);
      setStreak(0);
      setTotal(0);
    }
  };

  const categoriesList: { value: ProblemCategory | 'ALL'; label: string }[] = [
    { value: 'ALL', label: 'All Topics' },
    { value: 'TRANSLATION', label: 'Translation' },
    { value: 'REFLECTION', label: 'Reflection' },
    { value: 'ROTATION', label: 'Rotation' },
  ];

  if (!problem) return null;

  return (
    <div id="practice-mode-container" className="space-y-5">
      
      {/* 1. Category selector */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 space-y-3.5 shadow-lg">
        
        {/* Topic Selection */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
            <Sparkles size={11} />
            Topic Selection
          </span>
          <div className="flex flex-wrap gap-1.5 p-1 bg-slate-950/60 rounded-xl border border-slate-800">
            {categoriesList.map((cat) => (
              <button
                key={cat.value}
                type="button"
                id={`cat-btn-${cat.value.toLowerCase()}`}
                onClick={() => handleCategoryChange(cat.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-200 ${
                  activeCategory === cat.value
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Shape Selection */}
        <div className="space-y-2 pt-2 border-t border-slate-800/55">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
            <Sliders size={11} />
            Shape Selection
          </span>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950/60 rounded-xl border border-slate-800">
            {([
              { value: 'POINT', label: 'Single Point' },
              { value: 'POLYGON', label: 'Polygon (3-5 Vertices)' },
              { value: 'RANDOM', label: 'Random (Covers Everything)' }
            ] as const).map((mode) => (
              <button
                key={mode.value}
                type="button"
                id={`shape-btn-${mode.value.toLowerCase()}`}
                onClick={() => handleShapeModeChange(mode.value)}
                className={`px-2 py-1.5 rounded-lg text-[10px] font-semibold text-center cursor-pointer transition-all duration-200 ${
                  shapeModeSetting === mode.value
                    ? 'bg-emerald-600/15 border border-emerald-500/25 text-emerald-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Stats Dashboard */}
      <div id="stats-dashboard" className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex flex-col items-center justify-center text-center animate-fade-in">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">Accuracy</span>
          <span className="text-lg font-bold text-slate-100 font-mono mt-0.5">
            {total > 0 ? `${Math.round((score / total) * 100)}%` : '0%'}
          </span>
          <span className="text-[9px] text-slate-500 font-mono mt-0.5">({score}/{total})</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-1">
            <Award size={12} className="text-amber-400" />
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">Streak</span>
          </div>
          <span className="text-lg font-bold text-amber-400 font-mono mt-0.5">{streak}</span>
          <span className="text-[9px] text-slate-500 font-mono mt-0.5">correct in a row</span>
        </div>
        <button
          onClick={handleResetStats}
          id="reset-stats-btn"
          className="bg-slate-900/60 hover:bg-slate-800/50 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
        >
          <RotateCcw size={14} className="text-slate-500 group-hover:text-slate-300 transition-colors" />
          <span className="text-[10px] text-slate-400 font-mono mt-1 group-hover:text-slate-200">Reset Stats</span>
        </button>
      </div>

      {/* Question Card */}
      <div id="question-card" className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        
        {/* Category Indicator Tag */}
        <span className="absolute top-4 right-4 text-[9px] font-bold font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 uppercase tracking-wider">
          {problem.category.replace('_', ' ')}
        </span>

        {/* Question Text */}
        <div className="mt-2">
          <span className="text-xs font-bold font-mono text-indigo-400 uppercase tracking-wider">Question</span>
          <p className="text-sm sm:text-base text-slate-100 font-sans font-medium leading-relaxed mt-1 whitespace-pre-line">
            {problem.question}
          </p>
        </div>

        {/* Inputs & Form */}
        <form onSubmit={handleCheckAnswer} className="mt-6 space-y-4">
          
          {/* A. Point Coordinates Inputs */}
          {problem.inputType === 'coordinate' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono text-slate-400">Enter coordinates of the image point A':</span>
                {isAnswered && (
                  isCorrect ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-mono text-xs font-bold animate-fade-in">
                      <CheckCircle2 size={14} /> Correct
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/10 animate-fade-in">
                      Correct: ({problem.imagePoint?.x}, {problem.imagePoint?.y})
                    </span>
                  )
                )}
              </div>
              <div className={`flex items-center gap-4 bg-slate-950/60 p-4 rounded-xl border transition-all duration-200 ${
                isAnswered
                  ? isCorrect
                    ? 'border-emerald-500/30 bg-emerald-950/5'
                    : 'border-rose-500/30 bg-rose-950/5'
                  : 'border-slate-800'
              }`}>
                <div className="text-xl font-bold font-mono text-slate-500">(</div>
                
                {/* X Coordinate Input */}
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400 w-4 text-center">x:</span>
                  <input
                    type="number"
                    step="0.5"
                    min="-20"
                    max="20"
                    id="coordinate-input-x"
                    disabled={isAnswered}
                    value={userX}
                    onChange={(e) => setUserX(e.target.value)}
                    placeholder="e.g. 3"
                    className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-center font-mono text-sm text-slate-200 focus:outline-hidden disabled:opacity-50"
                    required
                  />
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      disabled={isAnswered}
                      onClick={() => setUserX(prev => (parseFloat(prev || '0') + 1).toString())}
                      className="p-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[9px] disabled:opacity-30 cursor-pointer"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={isAnswered}
                      onClick={() => setUserX(prev => (parseFloat(prev || '0') - 1).toString())}
                      className="p-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[9px] disabled:opacity-30 cursor-pointer"
                    >
                      ▼
                    </button>
                  </div>
                </div>

                <div className="text-xl font-bold font-mono text-slate-500">,</div>

                {/* Y Coordinate Input */}
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400 w-4 text-center">y:</span>
                  <input
                    type="number"
                    step="0.5"
                    min="-20"
                    max="20"
                    id="coordinate-input-y"
                    disabled={isAnswered}
                    value={userY}
                    onChange={(e) => setUserY(e.target.value)}
                    placeholder="e.g. -4"
                    className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-center font-mono text-sm text-slate-200 focus:outline-hidden disabled:opacity-50"
                    required
                  />
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      disabled={isAnswered}
                      onClick={() => setUserY(prev => (parseFloat(prev || '0') + 1).toString())}
                      className="p-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[9px] disabled:opacity-30 cursor-pointer"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={isAnswered}
                      onClick={() => setUserY(prev => (parseFloat(prev || '0') - 1).toString())}
                      className="p-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[9px] disabled:opacity-30 cursor-pointer"
                    >
                      ▼
                    </button>
                  </div>
                </div>

                <div className="text-xl font-bold font-mono text-slate-500">)</div>
              </div>
            </div>
          )}

          {/* B. Polygon Vertices Inputs */}
          {problem.inputType === 'polygon' && (
            <div className="space-y-3.5">
              <span className="text-xs font-mono text-slate-400 block">
                Enter coordinates for each transformed vertex of the {problem.preImagePolygon?.length === 3 ? 'triangle' : problem.preImagePolygon?.length === 4 ? 'quadrilateral' : 'pentagon'}:
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {polyInputs.map((input, idx) => {
                  const labelLetters = ['A', 'B', 'C', 'D', 'E'];
                  const label = `${labelLetters[idx] || `P${idx}`}'`;
                  
                  // Evaluate if this specific vertex input is correct
                  const isVertexCorrect = (() => {
                    if (!problem.correctPolygon || !problem.correctPolygon[idx]) return false;
                    const target = problem.correctPolygon[idx];
                    const px = parseFloat(input.x);
                    const py = parseFloat(input.y);
                    if (isNaN(px) || isNaN(py)) return false;
                    return Math.abs(px - target.x) < 0.01 && Math.abs(py - target.y) < 0.01;
                  })();

                  return (
                    <div key={idx} className={`p-3 rounded-xl border transition-all duration-200 space-y-2 ${
                      isAnswered
                        ? isVertexCorrect
                          ? 'bg-emerald-950/5 border-emerald-500/30'
                          : 'bg-rose-950/5 border-rose-500/30'
                        : 'bg-slate-950/50 border-slate-800/80'
                    }`}>
                      <div className="flex justify-between items-center border-b border-slate-900 pb-1">
                        <span className="text-xs font-bold font-mono text-blue-400">Vertex {label}</span>
                        {isAnswered && problem.correctPolygon && problem.correctPolygon[idx] && (
                          isVertexCorrect ? (
                            <span className="text-emerald-400 flex items-center gap-1 animate-fade-in" title="Correct">
                              <CheckCircle2 size={14} />
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/10 animate-fade-in">
                              Correct: ({problem.correctPolygon[idx].x}, {problem.correctPolygon[idx].y})
                            </span>
                          )
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono text-slate-500">(</span>
                        <input
                          type="number"
                          step="1"
                          min="-20"
                          max="20"
                          disabled={isAnswered}
                          value={input.x}
                          onChange={(e) => {
                            const updated = [...polyInputs];
                            updated[idx] = { ...updated[idx], x: e.target.value };
                            setPolyInputs(updated);
                          }}
                          placeholder="x'"
                          className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-lg py-1 text-center font-mono text-xs text-slate-200 focus:outline-hidden disabled:opacity-50"
                          required
                        />
                        <span className="text-xs font-mono text-slate-500">,</span>
                        <input
                          type="number"
                          step="1"
                          min="-20"
                          max="20"
                          disabled={isAnswered}
                          value={input.y}
                          onChange={(e) => {
                            const updated = [...polyInputs];
                            updated[idx] = { ...updated[idx], y: e.target.value };
                            setPolyInputs(updated);
                          }}
                          placeholder="y'"
                          className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-lg py-1 text-center font-mono text-xs text-slate-200 focus:outline-hidden disabled:opacity-50"
                          required
                        />
                        <span className="text-xs font-mono text-slate-500">)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* C. Quadrant Input (Multiple Choice) */}
          {problem.inputType === 'quadrant' && problem.options && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono text-slate-400">Select the correct location:</span>
                {isAnswered && (
                  isCorrect ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-mono text-xs font-bold animate-fade-in">
                      <CheckCircle2 size={14} /> Correct
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/10 animate-fade-in">
                      Correct: {problem.correctQuadrant}
                    </span>
                  )
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {problem.options.map((opt) => (
                  <button
                    type="button"
                    key={opt}
                    id={`quadrant-option-${opt.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                    disabled={isAnswered}
                    onClick={() => setSelectedQuadrant(opt)}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-semibold font-mono text-left cursor-pointer transition-all duration-200 ${
                      selectedQuadrant === opt
                        ? isAnswered
                          ? isCorrect
                            ? 'bg-emerald-600/10 border-emerald-500 text-emerald-300'
                            : 'bg-rose-600/10 border-rose-500 text-rose-300'
                          : 'bg-indigo-600/10 border-indigo-500 text-indigo-300'
                        : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 text-slate-400 hover:text-slate-300'
                    } disabled:opacity-50`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* D. Numeric Distance Input */}
          {problem.inputType === 'numeric' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono text-slate-400">Enter the numerical distance:</span>
                {isAnswered && (
                  isCorrect ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-mono text-xs font-bold animate-fade-in">
                      <CheckCircle2 size={14} /> Correct
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/10 animate-fade-in">
                      Correct: {problem.correctNumeric}
                    </span>
                  )
                )}
              </div>
              <div className={`flex items-center gap-3 bg-slate-950/60 p-4 rounded-xl border transition-all duration-200 ${
                isAnswered
                  ? isCorrect
                    ? 'border-emerald-500/30 bg-emerald-950/5'
                    : 'border-rose-500/30 bg-rose-950/5'
                  : 'border-slate-800'
              }`}>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  id="numeric-answer-input"
                  disabled={isAnswered}
                  value={userNumeric}
                  onChange={(e) => setUserNumeric(e.target.value)}
                  placeholder="Enter distance units"
                  className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 font-mono text-sm text-slate-200 focus:outline-hidden disabled:opacity-50"
                  required
                />
              </div>
            </div>
          )}

          {/* Controls Footer */}
          <div className="flex items-center justify-between gap-3 pt-2">
            
            {/* Show Hint / Formula Button */}
            <button
              type="button"
              id="hint-toggle-btn"
              onClick={handleToggleHint}
              disabled={isAnswered}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                showHint
                  ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                  : 'bg-slate-800 hover:bg-slate-700 border border-transparent text-slate-300 hover:text-slate-100'
              } disabled:opacity-30`}
            >
              <HelpCircle size={14} />
              {showHint ? 'Hide Visual Hint' : 'Show Visual Hint'}
            </button>

            {/* Submit / Next Button */}
            {!isAnswered ? (
              <button
                type="submit"
                id="check-answer-btn"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/10 cursor-pointer flex items-center gap-1"
              >
                Check Answer
              </button>
            ) : (
              <button
                type="button"
                id="next-problem-btn"
                onClick={() => loadNewProblem(activeCategory, shapeModeSetting)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-emerald-600/10 cursor-pointer flex items-center gap-1 group"
              >
                Next Problem
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

          </div>

        </form>

        {/* Formula Hint Box */}
        <AnimatePresence>
          {showHint && !isAnswered && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              id="formula-hint-box"
              className="mt-4 p-3 bg-slate-950/50 rounded-xl border border-amber-500/10 text-xs overflow-hidden"
            >
              <div className="flex items-start gap-2">
                <span className="text-[10px] font-bold font-mono text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">FORMULA</span>
                <div className="space-y-1">
                  <p className="font-mono text-amber-300 font-medium whitespace-pre-line leading-relaxed">
                    {problem.formula}
                  </p>
                  <p className="text-slate-400 leading-relaxed mt-1.5 font-sans">
                    <strong>Tip:</strong> {problem.hint}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Detailed Explanation / Feedback */}
        <AnimatePresence>
          {isAnswered && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              id="solution-explanation-box"
              className="mt-5 pt-5 border-t border-slate-800/80 overflow-hidden"
            >
              {/* Correct / Incorrect Banner */}
              <div className="flex items-center gap-2 mb-3.5">
                {isCorrect ? (
                  <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl w-full">
                    <CheckCircle2 size={16} />
                    <span className="font-bold text-xs">Correct! Awesome job!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl w-full">
                    <XCircle size={16} />
                    <span className="font-bold text-xs">Incorrect. Let's see how to solve it!</span>
                  </div>
                )}
              </div>

              {/* Step-by-step Solution */}
              <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/80 text-xs space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] font-bold font-mono text-indigo-400 uppercase tracking-wider">
                  <span>Step-by-Step Explanation</span>
                </div>
                <div className="text-slate-300 font-sans leading-relaxed whitespace-pre-line space-y-2">
                  {problem.explanation}
                </div>
                
                {/* Visual plotted confirmation on grid note */}
                <p className="text-[10px] text-slate-500 italic mt-3 font-mono">
                  {problem.shapeType === 'POLYGON' ? (
                    "* Look at the grid on the left to see your starting shape (blue) and the correctly transformed image shape (purple) with corresponding vertex translation paths!"
                  ) : (
                    "* Look at the grid on the left to see the pre-image P (blue), your guess (amber target if incorrect), and the correct image P' (purple) with its transformation path!"
                  )}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

    </div>
  );
}

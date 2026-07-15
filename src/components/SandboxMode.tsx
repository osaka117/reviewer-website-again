import React, { useState, useEffect } from 'react';
import { Point, ProblemCategory, TransformationDetails } from '../types';
import { applyTransformation } from '../utils/mathUtils';
import { Sparkles, CheckCircle2, AlertCircle, HelpCircle, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SandboxModeProps {
  preImage: Point;
  onPreImageChange: (p: Point) => void;
  onStateChange: (state: {
    preImage: Point;
    image?: Point;
    userAnswer?: Point;
    transformation?: any;
    preImagePolygon?: Point[];
    imagePolygon?: Point[];
    activeVertexIndex?: number;
  }) => void;
}

export default function SandboxMode({
  preImage,
  onPreImageChange,
  onStateChange,
}: SandboxModeProps) {
  // Shape mode: POINT or POLYGON
  const [shapeMode, setShapeMode] = useState<'POINT' | 'POLYGON'>('POINT');

  // Polygon Vertices
  const [polygonPoints, setPolygonPoints] = useState<Point[]>([
    { x: -3, y: 2 }, // A
    { x: 3, y: 2 },  // B
    { x: 4, y: -3 }, // C
    { x: -2, y: -3 },// D
  ]);
  const [activeVertexIndex, setActiveVertexIndex] = useState<number>(0);

  // Transformation parameters (restricted to simplified types)
  const [transType, setTransType] = useState<'TRANSLATION' | 'REFLECTION' | 'ROTATION'>('TRANSLATION');

  // Translation Params
  const [dx, setDx] = useState<number>(3);
  const [dy, setDy] = useState<number>(-2);

  // Reflection Params (Simplified to x-axis and y-axis)
  const [reflectionAxis, setReflectionAxis] = useState<'x-axis' | 'y-axis'>('x-axis');

  // Rotation Params (Simplified to 90 CW, 90 CCW, 180)
  const [rotationSetting, setRotationSetting] = useState<'90-CCW' | '90-CW' | '180'>('90-CCW');

  // User Prediction State (only used in Point Mode)
  const [predX, setPredX] = useState<string>('');
  const [predY, setPredY] = useState<string>('');

  // Checking State (Point Mode)
  const [hasChecked, setHasChecked] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [correctImage, setCorrectImage] = useState<Point | null>(null);

  // Sync active vertex to preImage when user clicks the grid
  useEffect(() => {
    if (shapeMode === 'POLYGON') {
      setPolygonPoints((prev) => {
        const currentActive = prev[activeVertexIndex];
        if (currentActive.x !== preImage.x || currentActive.y !== preImage.y) {
          const next = [...prev];
          next[activeVertexIndex] = preImage;
          return next;
        }
        return prev;
      });
    }
  }, [preImage, activeVertexIndex, shapeMode]);

  // Construct current transformation details
  const getTransformationDetails = (): TransformationDetails => {
    switch (transType) {
      case 'TRANSLATION':
        return { type: 'TRANSLATION', dx, dy };
      case 'REFLECTION':
        return { type: 'REFLECTION', axis: reflectionAxis };
      case 'ROTATION':
        if (rotationSetting === '90-CCW') {
          return { type: 'ROTATION', angle: 90, clockwise: false };
        } else if (rotationSetting === '90-CW') {
          return { type: 'ROTATION', angle: 90, clockwise: true };
        } else {
          return { type: 'ROTATION', angle: 180, clockwise: false };
        }
      default:
        return { type: 'TRANSLATION', dx: 0, dy: 0 };
    }
  };

  const details = getTransformationDetails();

  // Keep parent grid informed of current setup
  useEffect(() => {
    if (shapeMode === 'POLYGON') {
      const imgPoly = polygonPoints.map((p) => applyTransformation(p, details));
      onStateChange({
        preImage,
        image: undefined,
        userAnswer: undefined,
        transformation: details,
        preImagePolygon: polygonPoints,
        imagePolygon: imgPoly,
        activeVertexIndex,
      });
    } else {
      // POINT Mode
      if (!hasChecked) {
        onStateChange({
          preImage,
          image: undefined,
          userAnswer: undefined,
          transformation: details,
        });
      } else {
        const correctImg = applyTransformation(preImage, details);
        setCorrectImage(correctImg);

        const parsedX = parseFloat(predX);
        const parsedY = parseFloat(predY);
        const userGuess: Point | undefined = (isNaN(parsedX) || isNaN(parsedY)) ? undefined : { x: parsedX, y: parsedY };

        let correct = false;
        if (userGuess) {
          correct = Math.abs(userGuess.x - correctImg.x) < 0.01 && Math.abs(userGuess.y - correctImg.y) < 0.01;
        }
        setIsCorrect(correct);

        onStateChange({
          preImage,
          image: correctImg,
          userAnswer: userGuess,
          transformation: details,
        });
      }
    }
  }, [
    preImage,
    transType,
    dx,
    dy,
    reflectionAxis,
    rotationSetting,
    hasChecked,
    predX,
    predY,
    shapeMode,
    polygonPoints,
    activeVertexIndex,
  ]);

  // Handle vertex tab selection
  const handleVertexSelect = (index: number) => {
    setActiveVertexIndex(index);
    onPreImageChange(polygonPoints[index]);
  };

  // Handle Verify Button (Point Mode)
  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const correctImg = applyTransformation(preImage, details);
    setCorrectImage(correctImg);

    const parsedX = parseFloat(predX);
    const parsedY = parseFloat(predY);
    const userGuess: Point | undefined = (isNaN(parsedX) || isNaN(parsedY)) ? undefined : { x: parsedX, y: parsedY };

    let correct = false;
    if (userGuess) {
      correct = Math.abs(userGuess.x - correctImg.x) < 0.01 && Math.abs(userGuess.y - correctImg.y) < 0.01;
    }
    setIsCorrect(correct);
    setHasChecked(true);
  };

  // Clear Results & Prediction
  const handleReset = () => {
    setHasChecked(false);
    setPredX('');
    setPredY('');
    setCorrectImage(null);
  };

  // Toggle point vs polygon modes
  const handleShapeModeChange = (mode: 'POINT' | 'POLYGON') => {
    setShapeMode(mode);
    handleReset();
    if (mode === 'POLYGON') {
      onPreImageChange(polygonPoints[activeVertexIndex]);
    } else {
      onPreImageChange({ x: -3, y: 4 });
    }
  };

  // Text formula helper based on current transformation
  const getFormulaRuleText = () => {
    switch (transType) {
      case 'TRANSLATION':
        return `(x, y) → (x + ${dx > 0 ? '' : ''}${dx}, y + ${dy > 0 ? '' : ''}${dy})`;
      case 'REFLECTION':
        return reflectionAxis === 'x-axis' ? '(x, y) → (x, -y)' : '(x, y) → (-x, y)';
      case 'ROTATION':
        if (rotationSetting === '90-CCW') return '(x, y) → (-y, x)';
        if (rotationSetting === '90-CW') return '(x, y) → (y, -x)';
        return '(x, y) → (-x, -y)';
    }
  };

  return (
    <div id="sandbox-mode-container" className="space-y-5">
      
      {/* 1. Mode Switcher (Point vs 4-Pointed Polygon) */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 space-y-3 shadow-lg">
        <h3 className="text-xs font-bold font-mono text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
          <Layers size={13} />
          1. Select Workspace Mode
        </h3>
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <button
            type="button"
            id="mode-point-btn"
            onClick={() => handleShapeModeChange('POINT')}
            className={`px-3 py-2 rounded-lg text-xs font-bold font-sans cursor-pointer transition-all ${
              shapeMode === 'POINT'
                ? 'bg-indigo-600/15 border border-indigo-500/25 text-indigo-400'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/20'
            }`}
          >
            Single Point
          </button>
          <button
            type="button"
            id="mode-polygon-btn"
            onClick={() => handleShapeModeChange('POLYGON')}
            className={`px-3 py-2 rounded-lg text-xs font-bold font-sans cursor-pointer transition-all ${
              shapeMode === 'POLYGON'
                ? 'bg-indigo-600/15 border border-indigo-500/25 text-indigo-400'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/20'
            }`}
          >
            4-Pointed Polygon
          </button>
        </div>
      </div>

      {/* 2. Shape Coordinates Selector */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 space-y-4 shadow-lg">
        {shapeMode === 'POINT' ? (
          <>
            <h3 className="text-xs font-bold font-mono text-indigo-400 uppercase tracking-wider">
              2. Pre-Image Point P (Coordinates)
            </h3>
            
            <div className="flex items-center gap-3">
              {/* X coordinate controller */}
              <div className="flex-1 space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>X Coordinate:</span>
                  <span className="text-indigo-300 font-semibold">{preImage.x}</span>
                </div>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="1"
                  id="preimage-range-x"
                  value={preImage.x}
                  onChange={(e) => onPreImageChange({ x: parseInt(e.target.value, 10), y: preImage.y })}
                  className="w-full accent-indigo-500 h-1 bg-slate-850 rounded-lg cursor-pointer"
                />
              </div>

              {/* Y coordinate controller */}
              <div className="flex-1 space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>Y Coordinate:</span>
                  <span className="text-indigo-300 font-semibold">{preImage.y}</span>
                </div>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="1"
                  id="preimage-range-y"
                  value={preImage.y}
                  onChange={(e) => onPreImageChange({ x: preImage.x, y: parseInt(e.target.value, 10) })}
                  className="w-full accent-indigo-500 h-1 bg-slate-850 rounded-lg cursor-pointer"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 italic font-mono text-center">
              * Click any intersection on the graph to instantly move Point P!
            </p>
          </>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold font-mono text-indigo-400 uppercase tracking-wider">
                2. Design 4-Pointed Polygon Shape
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">Any custom polygon shape</span>
            </div>

            {/* Vertices selector tabs */}
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-950/60 rounded-xl border border-slate-800/85">
              {polygonPoints.map((p, idx) => {
                const label = ['A', 'B', 'C', 'D'][idx];
                const isActive = activeVertexIndex === idx;
                return (
                  <button
                    type="button"
                    key={label}
                    onClick={() => handleVertexSelect(idx)}
                    className={`py-1.5 rounded-lg text-xs font-bold font-mono text-center cursor-pointer transition-all border ${
                      isActive
                        ? 'bg-blue-600/15 border-blue-500/30 text-blue-400 shadow-sm'
                        : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {label}({p.x}, {p.y})
                  </button>
                );
              })}
            </div>

            {/* Sliders for current active vertex */}
            <div className="p-3 bg-slate-950/45 border border-slate-850 rounded-xl space-y-3">
              <div className="flex justify-between items-center text-[11px] font-mono">
                <span className="text-slate-400">Positioning Vertex: <strong className="text-blue-400 font-bold">Vertex {['A', 'B', 'C', 'D'][activeVertexIndex]}</strong></span>
                <span className="text-blue-300 font-bold">({polygonPoints[activeVertexIndex].x}, {polygonPoints[activeVertexIndex].y})</span>
              </div>

              <div className="space-y-3">
                {/* Active X Coordinate Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>X position:</span>
                    <span>{polygonPoints[activeVertexIndex].x}</span>
                  </div>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="1"
                    id="poly-vertex-x-slider"
                    value={polygonPoints[activeVertexIndex].x}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      const updated = [...polygonPoints];
                      updated[activeVertexIndex] = { ...updated[activeVertexIndex], x: val };
                      setPolygonPoints(updated);
                      onPreImageChange(updated[activeVertexIndex]);
                    }}
                    className="w-full accent-blue-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Active Y Coordinate Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>Y position:</span>
                    <span>{polygonPoints[activeVertexIndex].y}</span>
                  </div>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="1"
                    id="poly-vertex-y-slider"
                    value={polygonPoints[activeVertexIndex].y}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      const updated = [...polygonPoints];
                      updated[activeVertexIndex] = { ...updated[activeVertexIndex], y: val };
                      setPolygonPoints(updated);
                      onPreImageChange(updated[activeVertexIndex]);
                    }}
                    className="w-full accent-blue-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>
            
            <p className="text-[10px] text-slate-500 italic font-mono text-center">
              * Click the graph grid to instantly position Vertex {['A', 'B', 'C', 'D'][activeVertexIndex]}!
            </p>
          </>
        )}
      </div>

      {/* 3. Transformation Selection */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 space-y-4 shadow-lg">
        <h3 className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-wider">
          3. Apply Mathematical Transformation
        </h3>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950/60 rounded-xl border border-slate-800/80">
          {(['TRANSLATION', 'REFLECTION', 'ROTATION'] as const).map((type) => (
            <button
              key={type}
              id={`sandbox-type-${type.toLowerCase()}`}
              onClick={() => {
                setTransType(type);
                handleReset();
              }}
              className={`px-1 py-2 rounded-lg text-[10px] font-bold font-mono uppercase cursor-pointer text-center transition-all ${
                transType === type
                  ? 'bg-emerald-600/10 border border-emerald-500/20 text-emerald-400'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/20'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Dynamic Parameters Based on Selection */}
        <div className="bg-slate-950/40 border border-slate-800/50 rounded-xl p-3 text-xs space-y-3">
          
          {/* A. TRANSLATION */}
          {transType === 'TRANSLATION' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-mono text-slate-400">Translation rule:</span>
                <span className="font-mono bg-emerald-500/10 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded font-bold">
                  (x, y) → (x + {dx}, y + {dy})
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Horizontal dx: {dx > 0 ? `Right +${dx}` : dx < 0 ? `Left ${dx}` : 'None'}</span>
                  </div>
                  <input
                    type="range"
                    min="-8"
                    max="8"
                    step="1"
                    id="translation-dx-slider"
                    value={dx}
                    onChange={(e) => { setDx(parseInt(e.target.value, 10)); handleReset(); }}
                    className="w-full accent-emerald-500 h-1"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Vertical dy: {dy > 0 ? `Up +${dy}` : dy < 0 ? `Down ${dy}` : 'None'}</span>
                  </div>
                  <input
                    type="range"
                    min="-8"
                    max="8"
                    step="1"
                    id="translation-dy-slider"
                    value={dy}
                    onChange={(e) => { setDy(parseInt(e.target.value, 10)); handleReset(); }}
                    className="w-full accent-emerald-500 h-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* B. REFLECTION */}
          {transType === 'REFLECTION' && (
            <div className="space-y-3">
              <span className="font-mono text-slate-400 block">Reflection Axis:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="reflect-x-axis-btn"
                  onClick={() => { setReflectionAxis('x-axis'); handleReset(); }}
                  className={`py-1.5 rounded-lg border text-xs font-bold font-mono transition-all ${
                    reflectionAxis === 'x-axis'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  x-axis (y=0)
                </button>
                <button
                  type="button"
                  id="reflect-y-axis-btn"
                  onClick={() => { setReflectionAxis('y-axis'); handleReset(); }}
                  className={`py-1.5 rounded-lg border text-xs font-bold font-mono transition-all ${
                    reflectionAxis === 'y-axis'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  y-axis (x=0)
                </button>
              </div>
              <p className="text-[10px] text-slate-500 font-mono text-center">
                Rule: {reflectionAxis === 'x-axis' ? '(x, y) → (x, -y)' : '(x, y) → (-x, y)'}
              </p>
            </div>
          )}

          {/* C. ROTATION */}
          {transType === 'ROTATION' && (
            <div className="space-y-3">
              <span className="font-mono text-slate-400 block">Choose Rotation Rule:</span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  id="rotate-90-ccw-btn"
                  onClick={() => { setRotationSetting('90-CCW'); handleReset(); }}
                  className={`py-1.5 rounded-lg border text-[10px] font-bold font-mono transition-all text-center leading-tight ${
                    rotationSetting === '90-CCW'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  90° CCW
                </button>
                <button
                  type="button"
                  id="rotate-90-cw-btn"
                  onClick={() => { setRotationSetting('90-CW'); handleReset(); }}
                  className={`py-1.5 rounded-lg border text-[10px] font-bold font-mono transition-all text-center leading-tight ${
                    rotationSetting === '90-CW'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  90° CW
                </button>
                <button
                  type="button"
                  id="rotate-180-btn"
                  onClick={() => { setRotationSetting('180'); handleReset(); }}
                  className={`py-1.5 rounded-lg border text-[10px] font-bold font-mono transition-all text-center leading-tight ${
                    rotationSetting === '180'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  180° Rot
                </button>
              </div>
              <p className="text-[10px] text-slate-500 font-mono text-center">
                Rule: {rotationSetting === '90-CCW' ? '(x, y) → (-y, x)' : rotationSetting === '90-CW' ? '(x, y) → (y, -x)' : '(x, y) → (-x, -y)'}
              </p>
            </div>
          )}

        </div>
      </div>

      {/* 4. Predictions or Polygon Output */}
      {shapeMode === 'POINT' ? (
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 space-y-4 shadow-lg">
          <h3 className="text-xs font-bold font-mono text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={13} />
            4. Predict the Transformed Coordinates
          </h3>

          <form onSubmit={handleVerify} className="space-y-4">
            <div className="flex items-center gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              <div className="text-xl font-bold font-mono text-slate-500">(</div>
              
              {/* Predicted X Input */}
              <div className="flex-1 flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400 w-4 text-center">x':</span>
                <input
                  type="number"
                  step="1"
                  min="-20"
                  max="20"
                  id="prediction-input-x"
                  disabled={hasChecked}
                  value={predX}
                  onChange={(e) => setPredX(e.target.value)}
                  placeholder="Predict x'"
                  className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg px-2 py-1 text-center font-mono text-sm text-slate-200 focus:outline-hidden disabled:opacity-50"
                  required
                />
              </div>

              <div className="text-xl font-bold font-mono text-slate-500">,</div>

              {/* Predicted Y Input */}
              <div className="flex-1 flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400 w-4 text-center">y':</span>
                <input
                  type="number"
                  step="1"
                  min="-20"
                  max="20"
                  id="prediction-input-y"
                  disabled={hasChecked}
                  value={predY}
                  onChange={(e) => setPredY(e.target.value)}
                  placeholder="Predict y'"
                  className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg px-2 py-1 text-center font-mono text-sm text-slate-200 focus:outline-hidden disabled:opacity-50"
                  required
                />
              </div>

              <div className="text-xl font-bold font-mono text-slate-500">)</div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                id="sandbox-clear-btn"
                onClick={handleReset}
                className="px-3.5 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 hover:bg-slate-800/30 text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Reset Prediction
              </button>
              <button
                type="submit"
                id="sandbox-verify-btn"
                disabled={hasChecked}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-amber-600/10 cursor-pointer"
              >
                Verify Prediction
              </button>
            </div>
          </form>

          {/* Verification Walkthrough report */}
          <AnimatePresence>
            {hasChecked && correctImage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="pt-4 border-t border-slate-800 space-y-3"
              >
                {isCorrect ? (
                  <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl w-full text-xs">
                    <CheckCircle2 size={15} />
                    <span className="font-bold">Perfect! Your prediction is correct!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl w-full text-xs">
                    <AlertCircle size={15} />
                    <span className="font-bold">Prediction discrepancy found. See math below!</span>
                  </div>
                )}

                <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3 text-xs space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider">
                    <span>Transformation Walkthrough</span>
                    <span>Rule: {getFormulaRuleText()}</span>
                  </div>
                  
                  <div className="text-slate-300 font-sans leading-relaxed whitespace-pre-line space-y-1.5">
                    {transType === 'TRANSLATION' && (
                      <p>Sliding P({preImage.x}, {preImage.y}) horizontally by {dx} and vertically by {dy}:<br />
                      - x' = {preImage.x} + ({dx}) = {correctImage.x}<br />
                      - y' = {preImage.y} + ({dy}) = {correctImage.y}</p>
                    )}
                    {transType === 'REFLECTION' && (
                      <p>Reflecting P({preImage.x}, {preImage.y}) across the {reflectionAxis}:<br />
                      {reflectionAxis === 'x-axis' ? (
                        <span>- x' remains the same = {preImage.x}<br />- y' is negated: -({preImage.y}) = {correctImage.y}</span>
                      ) : (
                        <span>- x' is negated: -({preImage.x}) = {correctImage.x}<br />- y' remains the same = {preImage.y}</span>
                      )}</p>
                    )}
                    {transType === 'ROTATION' && (
                      <p>Rotating P({preImage.x}, {preImage.y}) about the origin:<br />
                      {rotationSetting === '90-CCW' && (
                        <span>- Swap x and y, and negate new x: x' = -y = -({preImage.y}) = {correctImage.x}, y' = x = {correctImage.y}</span>
                      )}
                      {rotationSetting === '90-CW' && (
                        <span>- Swap x and y, and negate new y: x' = y = {correctImage.x}, y' = -x = -({preImage.x}) = {correctImage.y}</span>
                      )}
                      {rotationSetting === '180' && (
                        <span>- Negate both coordinates: x' = -x = -({preImage.x}) = {correctImage.x}, y' = -y = -({preImage.y}) = {correctImage.y}</span>
                      )}</p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-850 flex justify-between font-mono text-[11px] font-semibold text-slate-200">
                    <span>Your Guess:</span>
                    <span className={isCorrect ? "text-emerald-400" : "text-rose-400"}>
                      ({parseFloat(predX)}, {parseFloat(predY)})
                    </span>
                  </div>
                  <div className="flex justify-between font-mono text-[11px] font-semibold text-slate-200">
                    <span>Correct Answer:</span>
                    <span className="text-purple-400">
                      ({correctImage.x}, {correctImage.y})
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* Polygon Vertices calculation report card */
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 space-y-3.5 shadow-lg">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold font-mono text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-purple-400" />
              4. Polygon Transformation Report
            </h3>
            <span className="text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/10 px-2 py-0.5 rounded-full">
              Live Output
            </span>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-3 text-[10px] font-bold font-mono text-slate-400 border-b border-slate-800/80 pb-2">
              <span>Pre-Image Vertex</span>
              <span>Transformation Rule</span>
              <span className="text-right">Transformed Image</span>
            </div>

            {polygonPoints.map((p, idx) => {
              const label = ['A', 'B', 'C', 'D'][idx];
              const transformed = applyTransformation(p, details);
              return (
                <div key={label} className="grid grid-cols-3 items-center text-xs font-mono py-1.5 border-b border-slate-850/40 text-slate-300">
                  <span className="font-semibold text-blue-400">{label}({p.x}, {p.y})</span>
                  
                  {/* Step Calculation detail */}
                  <span className="text-slate-500 text-[10px] font-sans">
                    {transType === 'TRANSLATION' && `(${p.x}${dx >= 0 ? '+' : ''}${dx}, ${p.y}${dy >= 0 ? '+' : ''}${dy})`}
                    {transType === 'REFLECTION' && (reflectionAxis === 'x-axis' ? `(${p.x}, -(${p.y}))` : `(-(${p.x}), ${p.y})`)}
                    {transType === 'ROTATION' && (
                      rotationSetting === '90-CCW' ? `(-(${p.y}), ${p.x})` :
                      rotationSetting === '90-CW' ? `(${p.y}, -(${p.x}))` :
                      `(-(${p.x}), -(${p.y}))`
                    )}
                  </span>

                  <span className="text-right font-semibold text-purple-400">{label}'({transformed.x}, {transformed.y})</span>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-slate-950/45 border border-slate-850 rounded-xl space-y-1.5 text-xs font-sans">
            <p className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider">
              Mathematical Summary
            </p>
            <p className="text-slate-300 leading-relaxed">
              Every vertex in the quadrilateral is processed using the rule <strong className="text-emerald-400 font-mono">{getFormulaRuleText()}</strong>. The figure retains its orientation, size, and shape under translation and reflection/rotation isometrics.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}

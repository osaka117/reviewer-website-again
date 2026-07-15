import React, { useEffect, useRef, useState } from 'react';
import { Point, ProblemCategory, TransformationDetails } from '../types';

interface CartesianGridProps {
  preImage: Point;
  image?: Point;
  userAnswer?: Point;
  transformation?: TransformationDetails;
  onGridClick?: (p: Point) => void;
  interactive?: boolean;
  preImagePolygon?: Point[];
  imagePolygon?: Point[];
  activeVertexIndex?: number;
}

export default function CartesianGrid({
  preImage,
  image,
  userAnswer,
  transformation,
  onGridClick,
  interactive = false,
  preImagePolygon,
  imagePolygon,
  activeVertexIndex,
}: CartesianGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState<number>(400);
  const [hoveredPoint, setHoveredPoint] = useState<Point | null>(null);

  const gridMax = 10;
  const margin = 30;

  // Track container size for responsive behavior
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        // Keep it square but within reasonable limits
        const newSize = Math.max(280, Math.min(width, 500));
        setSize(newSize);
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Conversions
  const activeSize = size - 2 * margin;
  const scale = activeSize / (2 * gridMax);

  const toPixels = (x: number, y: number) => {
    const px = size / 2 + x * scale;
    const py = size / 2 - y * scale;
    return { x: px, y: py };
  };

  const toCartesian = (px: number, py: number) => {
    const cx = (px - size / 2) / scale;
    const cy = (size / 2 - py) / scale;
    return {
      x: Math.max(-gridMax, Math.min(gridMax, Math.round(cx))),
      y: Math.max(-gridMax, Math.min(gridMax, Math.round(cy))),
    };
  };

  // Draw coordinate grid
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and set scale for high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    // 1. Draw Background
    ctx.fillStyle = '#1e293b'; // Slate 800 background (dark sleek theme for grid)
    ctx.fillRect(0, 0, size, size);

    // 2. Draw Grid Lines
    ctx.lineWidth = 1;
    for (let i = -gridMax; i <= gridMax; i++) {
      if (i === 0) continue; // draw axes separately

      // Vertical grid lines
      const pVertical = toPixels(i, 0);
      ctx.strokeStyle = '#334155'; // Slate 700
      ctx.beginPath();
      ctx.moveTo(pVertical.x, margin);
      ctx.lineTo(pVertical.x, size - margin);
      ctx.stroke();

      // Horizontal grid lines
      const pHorizontal = toPixels(0, i);
      ctx.strokeStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(margin, pHorizontal.y);
      ctx.lineTo(size - margin, pHorizontal.y);
      ctx.stroke();

      // Draw tick marks and labels
      ctx.fillStyle = '#94a3b8'; // Slate 400
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(i.toString(), pVertical.x, size / 2 + 5);

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(i.toString(), size / 2 - 8, pHorizontal.y);
    }

    // 3. Draw X and Y Axes
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#64748b'; // Slate 500
    const origin = toPixels(0, 0);

    // X-Axis
    ctx.beginPath();
    ctx.moveTo(margin - 10, origin.y);
    ctx.lineTo(size - margin + 10, origin.y);
    ctx.stroke();

    // Y-Axis
    ctx.beginPath();
    ctx.moveTo(origin.x, margin - 10);
    ctx.lineTo(origin.x, size - margin + 10);
    ctx.stroke();

    // Origin label
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('0', origin.x - 5, origin.y + 5);

    // 4. Draw Specific Transformation Support Elements
    if (transformation) {
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);

      if (transformation.type === 'REFLECTION') {
        const { axis, lineConstant = 0 } = transformation;
        ctx.strokeStyle = '#ef4444'; // Red 500 for line of reflection

        if (axis === 'y=x') {
          ctx.beginPath();
          const p1 = toPixels(-gridMax, -gridMax);
          const p2 = toPixels(gridMax, gridMax);
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();

          ctx.fillStyle = '#f87171';
          ctx.font = 'italic 11px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('y = x', p2.x - 30, p2.y - 12);
        } else if (axis === 'y=-x') {
          ctx.beginPath();
          const p1 = toPixels(-gridMax, gridMax);
          const p2 = toPixels(gridMax, -gridMax);
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();

          ctx.fillStyle = '#f87171';
          ctx.font = 'italic 11px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('y = -x', p2.x - 35, p2.y + 12);
        } else if (axis === 'x=k') {
          ctx.beginPath();
          const p1 = toPixels(lineConstant, -gridMax);
          const p2 = toPixels(lineConstant, gridMax);
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();

          ctx.fillStyle = '#f87171';
          ctx.font = 'italic 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`x = ${lineConstant}`, p2.x, margin - 15);
        } else if (axis === 'y=k') {
          ctx.beginPath();
          const p1 = toPixels(-gridMax, lineConstant);
          const p2 = toPixels(gridMax, lineConstant);
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();

          ctx.fillStyle = '#f87171';
          ctx.font = 'italic 11px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(`y = ${lineConstant}`, size - margin + 15, p1.y - 8);
        } else if (axis === 'x-axis') {
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#ef4444';
          ctx.beginPath();
          ctx.moveTo(margin, origin.y);
          ctx.lineTo(size - margin, origin.y);
          ctx.stroke();
        } else if (axis === 'y-axis') {
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#ef4444';
          ctx.beginPath();
          ctx.moveTo(origin.x, margin);
          ctx.lineTo(origin.x, size - margin);
          ctx.stroke();
        } else if (axis === 'origin') {
          ctx.fillStyle = '#f87171';
          ctx.beginPath();
          ctx.arc(origin.x, origin.y, 5, 0, 2 * Math.PI);
          ctx.fill();
        }
      } else if (transformation.type === 'ROTATION') {
        const { angle = 90, clockwise } = transformation;
        ctx.strokeStyle = '#eab308'; // Yellow 500
        ctx.fillStyle = '#fef08a';

        // Draw an arc around origin
        const radius = Math.sqrt(preImage.x * preImage.x + preImage.y * preImage.y) * scale;
        if (radius > 0) {
          ctx.beginPath();
          const startAngle = Math.atan2(-preImage.y, preImage.x);
          let endAngle = startAngle;
          const radDiff = (angle * Math.PI) / 180;

          if (clockwise) {
            endAngle = startAngle + radDiff;
          } else {
            endAngle = startAngle - radDiff;
          }

          ctx.arc(origin.x, origin.y, radius, startAngle, endAngle, !clockwise);
          ctx.stroke();
        }
      }

      ctx.setLineDash([]); // reset dash
    }

    // 5. Draw Transformation Path & Polygons
    if (preImagePolygon && preImagePolygon.length >= 3) {
      const numVertices = preImagePolygon.length;
      // Draw Pre-Image Polygon
      ctx.fillStyle = 'rgba(59, 130, 246, 0.22)';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      const p0 = toPixels(preImagePolygon[0].x, preImagePolygon[0].y);
      ctx.moveTo(p0.x, p0.y);
      for (let i = 1; i < numVertices; i++) {
        const pt = toPixels(preImagePolygon[i].x, preImagePolygon[i].y);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw active vertex indicator / glow if provided
      if (typeof activeVertexIndex === 'number' && activeVertexIndex >= 0 && activeVertexIndex < numVertices) {
        const activePt = preImagePolygon[activeVertexIndex];
        const activePix = toPixels(activePt.x, activePt.y);
        ctx.strokeStyle = '#f59e0b'; // Amber-450 focus ring
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(activePix.x, activePix.y, 11, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // Draw vertices circles and labels for Pre-Image Polygon
      preImagePolygon.forEach((p, i) => {
        const pPix = toPixels(p.x, p.y);
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(pPix.x, pPix.y, 6.5, 0, 2 * Math.PI);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Label
        const labelName = ['A', 'B', 'C', 'D', 'E', 'F', 'G'][i] || `P${i}`;
        ctx.fillStyle = '#60a5fa';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = p.x > 0 ? 'left' : 'right';
        ctx.fillText(
          `${labelName}(${p.x}, ${p.y})`,
          pPix.x + (p.x > 0 ? 10 : -10),
          pPix.y - 4
        );
      });

      // Draw Image Polygon if provided
      if (imagePolygon && imagePolygon.length === numVertices) {
        ctx.fillStyle = 'rgba(192, 132, 252, 0.22)';
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        const pi0 = toPixels(imagePolygon[0].x, imagePolygon[0].y);
        ctx.moveTo(pi0.x, pi0.y);
        for (let i = 1; i < numVertices; i++) {
          const pt = toPixels(imagePolygon[i].x, imagePolygon[i].y);
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw vertices circles and labels for Image Polygon
        imagePolygon.forEach((p, i) => {
          const pPix = toPixels(p.x, p.y);
          ctx.fillStyle = '#c084fc';
          ctx.beginPath();
          ctx.arc(pPix.x, pPix.y, 6.5, 0, 2 * Math.PI);
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Label
          const labelName = ['A', 'B', 'C', 'D', 'E', 'F', 'G'][i] || `P${i}`;
          ctx.fillStyle = '#c084fc';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = p.x > 0 ? 'left' : 'right';
          ctx.fillText(
            `${labelName}'(${p.x}, ${p.y})`,
            pPix.x + (p.x > 0 ? 10 : -10),
            pPix.y - 4
          );
        });

        // Draw dashed connector lines between pre-image vertices and image vertices
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = '#94a3b8';
        ctx.setLineDash([3, 3]);
        for (let i = 0; i < numVertices; i++) {
          const pStart = toPixels(preImagePolygon[i].x, preImagePolygon[i].y);
          const pEnd = toPixels(imagePolygon[i].x, imagePolygon[i].y);
          ctx.beginPath();
          ctx.moveTo(pStart.x, pStart.y);
          ctx.lineTo(pEnd.x, pEnd.y);
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }
    } else {
      // 5. Draw Transformation Path for Single Point (Connecting pre-image and image)
      if (image) {
        const pStart = toPixels(preImage.x, preImage.y);
        const pEnd = toPixels(image.x, image.y);

        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#94a3b8'; // Slate 400
        ctx.setLineDash([3, 3]);

        if (transformation && transformation.type === 'TRANSLATION') {
          // Draw horizontal component, then vertical component
          const pMid = toPixels(image.x, preImage.y);
          ctx.strokeStyle = '#10b981'; // Emerald 500 for translation steps
          ctx.beginPath();
          ctx.moveTo(pStart.x, pStart.y);
          ctx.lineTo(pMid.x, pMid.y);
          ctx.stroke();

          ctx.strokeStyle = '#06b6d4'; // Cyan 500
          ctx.beginPath();
          ctx.moveTo(pMid.x, pMid.y);
          ctx.lineTo(pEnd.x, pEnd.y);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.moveTo(pStart.x, pStart.y);
          ctx.lineTo(pEnd.x, pEnd.y);
          ctx.stroke();
        }

        ctx.setLineDash([]); // reset
      }

      // 6. Draw User Answer Guess (Target)
      if (userAnswer) {
        const pUser = toPixels(userAnswer.x, userAnswer.y);
        ctx.strokeStyle = '#f97316'; // Amber 500
        ctx.lineWidth = 2;

        // Draw crosshair target
        ctx.beginPath();
        ctx.arc(pUser.x, pUser.y, 8, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(pUser.x - 12, pUser.y);
        ctx.lineTo(pUser.x + 12, pUser.y);
        ctx.moveTo(pUser.x, pUser.y - 12);
        ctx.lineTo(pUser.x, pUser.y + 12);
        ctx.stroke();

        ctx.fillStyle = '#f97316';
        ctx.font = '9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('Your Answer', pUser.x + 14, pUser.y + 3);
      }

      // 7. Draw Pre-Image Point P
      const pStartPix = toPixels(preImage.x, preImage.y);
      ctx.fillStyle = '#3b82f6'; // Blue 500
      ctx.beginPath();
      ctx.arc(pStartPix.x, pStartPix.y, 7, 0, 2 * Math.PI);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // label for preImage
      ctx.fillStyle = '#60a5fa'; // Light Blue
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = preImage.x > 0 ? 'left' : 'right';
      ctx.fillText(
        `P(${preImage.x}, ${preImage.y})`,
        pStartPix.x + (preImage.x > 0 ? 12 : -12),
        pStartPix.y - 5
      );

      // 8. Draw Image Point P'
      if (image) {
        const pEndPix = toPixels(image.x, image.y);
        ctx.fillStyle = '#c084fc'; // Purple 400
        ctx.beginPath();
        ctx.arc(pEndPix.x, pEndPix.y, 7, 0, 2 * Math.PI);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // label for image
        ctx.fillStyle = '#c084fc';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = image.x > 0 ? 'left' : 'right';
        ctx.fillText(
          `P'(${image.x}, ${image.y})`,
          pEndPix.x + (image.x > 0 ? 12 : -12),
          pEndPix.y - 5
        );
      }
    }

    // 9. Draw Hovered Point
    if (hoveredPoint && interactive) {
      const pHoverPix = toPixels(hoveredPoint.x, hoveredPoint.y);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.arc(pHoverPix.x, pHoverPix.y, 12, 0, 2 * Math.PI);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '10px monospace';
      ctx.textAlign = hoveredPoint.x > 0 ? 'left' : 'right';
      ctx.fillText(
        `(${hoveredPoint.x}, ${hoveredPoint.y})`,
        pHoverPix.x + (hoveredPoint.x > 0 ? 15 : -15),
        pHoverPix.y + 12
      );
    }
  }, [size, preImage, image, userAnswer, transformation, hoveredPoint, interactive, preImagePolygon, imagePolygon, activeVertexIndex]);

  // Handle Mouse Interactivity
  const getMouseCoord = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    // Convert client pixels to canvas pixels based on actual scaling
    const scaleX = size / rect.width;
    const scaleY = size / rect.height;

    return toCartesian(px * scaleX, py * scaleY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    const pt = getMouseCoord(e);
    if (pt) {
      if (!hoveredPoint || hoveredPoint.x !== pt.x || hoveredPoint.y !== pt.y) {
        setHoveredPoint(pt);
      }
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive || !onGridClick) return;
    const pt = getMouseCoord(e);
    if (pt) {
      onGridClick(pt);
    }
  };

  return (
    <div
      ref={containerRef}
      id="canvas-container"
      className="w-full flex justify-center items-center p-2 rounded-2xl bg-slate-900 shadow-xl overflow-hidden"
    >
      <div className="relative">
        <canvas
          ref={canvasRef}
          id="cartesian-plane-canvas"
          className={`rounded-xl shadow-inner ${interactive ? 'cursor-crosshair' : 'cursor-default'}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        />
        {interactive && (
          <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-xs text-slate-300 text-[10px] font-mono px-2 py-1 rounded border border-slate-700/50 select-none">
            Click grid to position Point P
          </div>
        )}
      </div>
    </div>
  );
}

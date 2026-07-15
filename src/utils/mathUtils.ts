import { Point, Problem, ProblemCategory, TransformationDetails } from '../types';

export function applyTransformation(p: Point, details: TransformationDetails): Point {
  const { type, dx = 0, dy = 0, axis, lineConstant = 0, angle, clockwise, scaleFactor = 1 } = details;

  switch (type) {
    case 'TRANSLATION':
      return { x: p.x + dx, y: p.y + dy };

    case 'REFLECTION':
      if (axis === 'x-axis') {
        return { x: p.x, y: -p.y };
      } else if (axis === 'y-axis') {
        return { x: -p.x, y: p.y };
      } else if (axis === 'origin') {
        return { x: -p.x, y: -p.y };
      } else if (axis === 'y=x') {
        return { x: p.y, y: p.x };
      } else if (axis === 'y=-x') {
        return { x: -p.y, y: -p.x };
      } else if (axis === 'x=k') {
        return { x: 2 * lineConstant - p.x, y: p.y };
      } else if (axis === 'y=k') {
        return { x: p.x, y: 2 * lineConstant - p.y };
      }
      return { ...p };

    case 'ROTATION': {
      // Standardize to counter-clockwise angle
      let ccwAngle = angle || 90;
      if (clockwise) {
        ccwAngle = (360 - ccwAngle) % 360 as 90 | 180 | 270;
      }

      if (ccwAngle === 90) {
        return { x: -p.y, y: p.x };
      } else if (ccwAngle === 180) {
        return { x: -p.x, y: -p.y };
      } else if (ccwAngle === 270) {
        return { x: p.y, y: -p.x };
      }
      return { ...p };
    }

    default:
      return { ...p };
  }
}

export function getQuadrantOrAxis(p: Point): string {
  if (p.x > 0 && p.y > 0) return 'Quadrant I';
  if (p.x < 0 && p.y > 0) return 'Quadrant II';
  if (p.x < 0 && p.y < 0) return 'Quadrant III';
  if (p.x > 0 && p.y < 0) return 'Quadrant IV';
  if (p.x === 0 && p.y === 0) return 'Origin (0,0)';
  if (p.x === 0 && p.y !== 0) return 'y-axis';
  if (p.x !== 0 && p.y === 0) return 'x-axis';
  return 'Unknown';
}

export function generateRandomPolygon(numPointsSetting?: number): Point[] {
  const triangles = [
    [ { x: -3, y: -2 }, { x: 3, y: -2 }, { x: 0, y: 4 } ],
    [ { x: -2, y: 3 }, { x: 2, y: 3 }, { x: -2, y: -1 } ],
    [ { x: -3, y: 0 }, { x: 3, y: 0 }, { x: 0, y: 3 } ],
    [ { x: -4, y: 1 }, { x: 1, y: 4 }, { x: -1, y: -2 } ]
  ];

  const quadrilaterals = [
    [ { x: -2, y: 3 }, { x: 2, y: 3 }, { x: 2, y: -1 }, { x: -2, y: -1 } ], // Square/Rectangle
    [ { x: -3, y: 2 }, { x: 3, y: 2 }, { x: 5, y: -2 }, { x: -5, y: -2 } ], // Trapezoid
    [ { x: -2, y: 2 }, { x: 3, y: 2 }, { x: 2, y: -2 }, { x: -3, y: -2 } ], // Parallelogram
    [ { x: 0, y: 4 }, { x: 3, y: 1 }, { x: 0, y: -2 }, { x: -3, y: 1 } ],   // Kite/Diamond
  ];

  const pentagons = [
    [ { x: 0, y: 4 }, { x: 3, y: 2 }, { x: 2, y: -2 }, { x: -2, y: -2 }, { x: -3, y: 2 } ],
    [ { x: -1, y: 3 }, { x: 3, y: 3 }, { x: 4, y: 0 }, { x: 1, y: -3 }, { x: -3, y: 0 } ],
    [ { x: 0, y: 4 }, { x: 3, y: 1 }, { x: 3, y: -3 }, { x: -3, y: -3 }, { x: -3, y: 1 } ],
    [ { x: -4, y: 2 }, { x: 0, y: 4 }, { x: 4, y: 2 }, { x: 2, y: -2 }, { x: -2, y: -2 } ]
  ];

  const resolvedNum = numPointsSetting || [3, 4, 5][Math.floor(Math.random() * 3)];
  let pool = quadrilaterals;
  if (resolvedNum === 3) {
    pool = triangles;
  } else if (resolvedNum === 5) {
    pool = pentagons;
  }

  // Choose one shape from pool
  const baseShape = pool[Math.floor(Math.random() * pool.length)];
  
  // Randomly translate it within bounds so all coordinates stay in [-5, 5]
  const shiftX = Math.floor(Math.random() * 5) - 2; // -2 to 2
  const shiftY = Math.floor(Math.random() * 5) - 2; // -2 to 2
  
  return baseShape.map(p => ({
    x: p.x + shiftX,
    y: p.y + shiftY
  }));
}

export function generateProblem(
  category?: ProblemCategory,
  shapeTypeSetting: 'POINT' | 'POLYGON' | 'RANDOM' = 'RANDOM'
): Problem {
  const categories: ProblemCategory[] = ['TRANSLATION', 'REFLECTION', 'ROTATION'];
  const activeCategory = category || categories[Math.floor(Math.random() * categories.length)];
  const id = Math.random().toString(36).substring(2, 9);

  const activeShapeType = shapeTypeSetting === 'RANDOM'
    ? (Math.random() > 0.5 ? 'POINT' : 'POLYGON')
    : shapeTypeSetting;

  const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  const randIntNonZero = (min: number, max: number) => {
    let val = 0;
    while (val === 0) {
      val = randInt(min, max);
    }
    return val;
  };

  if (activeShapeType === 'POINT') {
    switch (activeCategory) {
      case 'TRANSLATION': {
        const x = randInt(-6, 6);
        const y = randInt(-6, 6);
        const p: Point = { x, y };

        const dx = randIntNonZero(-6, 6);
        const dy = randIntNonZero(-6, 6);
        const details: TransformationDetails = { type: 'TRANSLATION', dx, dy };
        const img = applyTransformation(p, details);

        return {
          id,
          category: 'TRANSLATION',
          shapeType: 'POINT',
          question: `Point A(${x}, ${y}) is translated by the vector T = ⟨${dx}, ${dy}⟩. What are the coordinates of the image point A'?`,
          hint: "To translate a point by a vector ⟨dx, dy⟩, simply add dx to the x-coordinate and dy to the y-coordinate.",
          formula: "A'(x', y') = (x + dx, y + dy)",
          inputType: 'coordinate',
          correctCoordinate: img,
          preImagePoint: p,
          imagePoint: img,
          transformationDetails: details,
          explanation: `We apply the translation vector T = ⟨${dx}, ${dy}⟩ to A(${x}, ${y}):\n` +
            `- New x-coordinate: x' = x + dx = ${x} + (${dx}) = ${img.x}\n` +
            `- New y-coordinate: y' = y + dy = ${y} + (${dy}) = ${img.y}\n` +
            `The coordinates of the image point A' are **(${img.x}, ${img.y})**.`
        };
      }

      case 'REFLECTION': {
        const subtypes: Array<'x-axis' | 'y-axis'> = ['x-axis', 'y-axis'];
        const axis = subtypes[Math.floor(Math.random() * subtypes.length)];

        const x = randIntNonZero(-6, 6);
        const y = randIntNonZero(-6, 6);
        const p: Point = { x, y };

        const details: TransformationDetails = { type: 'REFLECTION', axis };
        const img = applyTransformation(p, details);

        const questionText = `Point A(${x}, ${y}) is reflected across the ${axis}. What are the coordinates of the image point A'?`;
        const hintText = axis === 'x-axis'
          ? "Reflecting across the x-axis keeps the x-coordinate the same but negates the y-coordinate."
          : "Reflecting across the y-axis keeps the y-coordinate the same but negates the x-coordinate.";
        const formulaText = axis === 'x-axis' ? "A'(x, y) → (x, -y)" : "A'(x, y) → (-x, y)";
        const explanationText = axis === 'x-axis'
          ? `Reflecting A(${x}, ${y}) across the x-axis:\n- The x-coordinate remains ${x}.\n- The y-coordinate is negated: -(${y}) = ${img.y}.\nImage A' is **(${img.x}, ${img.y})**.`
          : `Reflecting A(${x}, ${y}) across the y-axis:\n- The x-coordinate is negated: -(${x}) = ${img.x}.\n- The y-coordinate remains ${y}.\nImage A' is **(${img.x}, ${img.y})**.`;

        return {
          id,
          category: 'REFLECTION',
          shapeType: 'POINT',
          question: questionText,
          hint: hintText,
          formula: formulaText,
          inputType: 'coordinate',
          correctCoordinate: img,
          preImagePoint: p,
          imagePoint: img,
          transformationDetails: details,
          explanation: explanationText
        };
      }

      case 'ROTATION': {
        const angles: (90 | 180)[ ] = [90, 180];
        const angle = angles[Math.floor(Math.random() * angles.length)];
        const clockwise = Math.random() > 0.5;

        const x = randIntNonZero(-6, 6);
        const y = randIntNonZero(-6, 6);
        const p: Point = { x, y };

        const details: TransformationDetails = { type: 'ROTATION', angle, clockwise };
        const img = applyTransformation(p, details);

        const dirStr = clockwise ? "Clockwise" : "Counterclockwise";
        let formulaStr = "";
        let explanationStr = "";

        if (angle === 180) {
          formulaStr = "(x, y) → (-x, -y)";
          explanationStr = `A 180° rotation maps (x, y) to (-x, -y):\n- New x: x' = -x = -(${x}) = ${img.x}\n- New y: y' = -y = -(${y}) = ${img.y}\nSo, the image A' is **(${img.x}, ${img.y})**.`;
        } else if (!clockwise) {
          formulaStr = "90° Counterclockwise = (x, y) → (-y, x)";
          explanationStr = `Rotating A(${x}, ${y}) by 90° Counterclockwise maps (x, y) to (-y, x):\n- New x: x' = -y = -(${y}) = ${img.x}\n- New y: y' = x = ${x}\nSo, the image A' is **(${img.x}, ${img.y})**.`;
        } else {
          formulaStr = "90° Clockwise = (x, y) → (y, -x)";
          explanationStr = `Rotating A(${x}, ${y}) by 90° Clockwise maps (x, y) to (y, -x):\n- New x: x' = y = ${y}\n- New y: y' = -x = -(${x}) = ${img.y}\nSo, the image A' is **(${img.x}, ${img.y})**.`;
        }

        return {
          id,
          category: 'ROTATION',
          shapeType: 'POINT',
          question: `Rotate point A(${x}, ${y}) by ${angle === 180 ? '180°' : `90° ${dirStr}`} about the origin. What are the coordinates of the image point A'?`,
          hint: angle === 180
            ? "A 180° rotation around the origin negates both coordinates: (x, y) → (-x, -y)."
            : clockwise
              ? "A 90° clockwise rotation maps: (x, y) → (y, -x)."
              : "A 90° counterclockwise rotation maps: (x, y) → (-y, x).",
          formula: formulaStr,
          inputType: 'coordinate',
          correctCoordinate: img,
          preImagePoint: p,
          imagePoint: img,
          transformationDetails: details,
          explanation: `We apply a rotation of ${angle === 180 ? '180°' : `90° ${dirStr}`} to A(${x}, ${y}) about the origin:\n` + explanationStr
        };
      }
    }
  } else {
    // POLYGON Mode (dynamic 3 to 5 vertices)
    const preImagePolygon = generateRandomPolygon();
    const numVertices = preImagePolygon.length;

    const labelLetters = ['A', 'B', 'C', 'D', 'E'];
    const shapeName = numVertices === 3 ? 'triangle' : numVertices === 4 ? 'quadrilateral' : 'pentagon';
    const shapeLetterName = labelLetters.slice(0, numVertices).join('');
    const verticesDesc = preImagePolygon.map((p, i) => `${labelLetters[i]}(${p.x}, ${p.y})`).join(', ');
    const primeLetterName = labelLetters.slice(0, numVertices).map(l => l + "'").join(', ');

    switch (activeCategory) {
      case 'TRANSLATION': {
        const dx = randIntNonZero(-5, 5);
        const dy = randIntNonZero(-5, 5);
        const details: TransformationDetails = { type: 'TRANSLATION', dx, dy };
        const correctPolygon = preImagePolygon.map(p => applyTransformation(p, details));

        // build explanation steps
        const steps: string[] = [];
        for (let i = 0; i < numVertices; i++) {
          const p = preImagePolygon[i];
          const img = correctPolygon[i];
          const label = labelLetters[i];
          steps.push(`- ${label}(${p.x}, ${p.y}) → ${label}'(${p.x} + (${dx}), ${p.y} + (${dy})) = ${label}'(${img.x}, ${img.y})`);
        }

        const correctVerticesStr = correctPolygon.map((p, i) => `${labelLetters[i]}'(${p.x}, ${p.y})`).join(', ');

        return {
          id,
          category: 'TRANSLATION',
          shapeType: 'POLYGON',
          question: `The ${shapeName} ${shapeLetterName} has vertices ${verticesDesc}. ` +
            `It is translated by the vector T = ⟨${dx}, ${dy}⟩. Enter the coordinates of the image vertices ${primeLetterName}.`,
          hint: "For each vertex (x, y), add dx to the x-coordinate and dy to the y-coordinate.",
          formula: "A'(x', y') = (x + dx, y + dy)",
          inputType: 'polygon',
          correctPolygon,
          preImagePoint: preImagePolygon[0],
          preImagePolygon,
          imagePolygon: correctPolygon,
          transformationDetails: details,
          explanation: `Let's translate each vertex of the ${shapeName} by T = ⟨${dx}, ${dy}⟩:\n` +
            steps.join('\n') + `\n\n` +
            `The correct image vertices are:\n` +
            `**${correctVerticesStr}**.`
        };
      }

      case 'REFLECTION': {
        const subtypes: Array<'x-axis' | 'y-axis'> = ['x-axis', 'y-axis'];
        const axis = subtypes[Math.floor(Math.random() * subtypes.length)];

        const details: TransformationDetails = { type: 'REFLECTION', axis };
        const correctPolygon = preImagePolygon.map(p => applyTransformation(p, details));

        const hintText = axis === 'x-axis'
          ? "Reflecting across the x-axis keeps x-coordinates unchanged but negates the y-coordinates."
          : "Reflecting across the y-axis keeps y-coordinates unchanged but negates the x-coordinates.";
        const formulaText = axis === 'x-axis' ? "(x, y) → (x, -y)" : "(x, y) → (-x, y)";

        const steps: string[] = [];
        for (let i = 0; i < numVertices; i++) {
          const p = preImagePolygon[i];
          const img = correctPolygon[i];
          const label = labelLetters[i];
          if (axis === 'x-axis') {
            steps.push(`- ${label}(${p.x}, ${p.y}) → ${label}'(${p.x}, -(${p.y})) = ${label}'(${img.x}, ${img.y})`);
          } else {
            steps.push(`- ${label}(${p.x}, ${p.y}) → ${label}'(-(${p.x}), ${p.y}) = ${label}'(${img.x}, ${img.y})`);
          }
        }

        const correctVerticesStr = correctPolygon.map((p, i) => `${labelLetters[i]}'(${p.x}, ${p.y})`).join(', ');

        return {
          id,
          category: 'REFLECTION',
          shapeType: 'POLYGON',
          question: `The ${shapeName} ${shapeLetterName} has vertices ${verticesDesc}. ` +
            `It is reflected across the ${axis}. Enter the coordinates of the image vertices ${primeLetterName}.`,
          hint: hintText,
          formula: formulaText,
          inputType: 'polygon',
          correctPolygon,
          preImagePoint: preImagePolygon[0],
          preImagePolygon,
          imagePolygon: correctPolygon,
          transformationDetails: details,
          explanation: `Let's reflect each vertex of the ${shapeName} across the ${axis}:\n` +
            steps.join('\n') + `\n\n` +
            `The correct image vertices are:\n` +
            `**${correctVerticesStr}**.`
        };
      }

      case 'ROTATION': {
        const angles: (90 | 180)[] = [90, 180];
        const angle = angles[Math.floor(Math.random() * angles.length)];
        const clockwise = Math.random() > 0.5;

        const details: TransformationDetails = { type: 'ROTATION', angle, clockwise };
        const correctPolygon = preImagePolygon.map(p => applyTransformation(p, details));

        const dirStr = clockwise ? "Clockwise" : "Counterclockwise";
        let formulaStr = "";
        let explanationHeader = "";
        const steps: string[] = [];

        if (angle === 180) {
          formulaStr = "(x, y) → (-x, -y)";
          explanationHeader = `Rotating 180° around the origin negates both coordinates: (x, y) → (-x, -y).`;
          for (let i = 0; i < numVertices; i++) {
            const p = preImagePolygon[i];
            const img = correctPolygon[i];
            const label = labelLetters[i];
            steps.push(`- ${label}(${p.x}, ${p.y}) → ${label}'(-(${p.x}), -(${p.y})) = ${label}'(${img.x}, ${img.y})`);
          }
        } else if (!clockwise) {
          formulaStr = "90° Counterclockwise = (x, y) → (-y, x)";
          explanationHeader = `Rotating 90° Counterclockwise swaps the coordinates and negates the new x-coordinate: (x, y) → (-y, x).`;
          for (let i = 0; i < numVertices; i++) {
            const p = preImagePolygon[i];
            const img = correctPolygon[i];
            const label = labelLetters[i];
            steps.push(`- ${label}(${p.x}, ${p.y}) → ${label}'(-(${p.y}), ${p.x}) = ${label}'(${img.x}, ${img.y})`);
          }
        } else {
          formulaStr = "90° Clockwise = (x, y) → (y, -x)";
          explanationHeader = `Rotating 90° Clockwise swaps the coordinates and negates the new y-coordinate: (x, y) → (y, -x).`;
          for (let i = 0; i < numVertices; i++) {
            const p = preImagePolygon[i];
            const img = correctPolygon[i];
            const label = labelLetters[i];
            steps.push(`- ${label}(${p.x}, ${p.y}) → ${label}'(${p.y}, -(${p.x})) = ${label}'(${img.x}, ${img.y})`);
          }
        }

        const correctVerticesStr = correctPolygon.map((p, i) => `${labelLetters[i]}'(${p.x}, ${p.y})`).join(', ');

        return {
          id,
          category: 'ROTATION',
          shapeType: 'POLYGON',
          question: `The ${shapeName} ${shapeLetterName} has vertices ${verticesDesc}. ` +
            `Rotate it by ${angle === 180 ? '180°' : `90° ${dirStr}`} about the origin. Enter the coordinates of the image vertices ${primeLetterName}.`,
          hint: angle === 180
            ? "A 180° rotation around the origin negates both coordinates: (x, y) → (-x, -y)."
            : clockwise
              ? "A 90° clockwise rotation maps: (x, y) → (y, -x)."
              : "A 90° counterclockwise rotation maps: (x, y) → (-y, x).",
          formula: formulaStr,
          inputType: 'polygon',
          correctPolygon,
          preImagePoint: preImagePolygon[0],
          preImagePolygon,
          imagePolygon: correctPolygon,
          transformationDetails: details,
          explanation: `${explanationHeader}\nLet's rotate each vertex of the ${shapeName}:\n` +
            steps.join('\n') + `\n\n` +
            `The correct image vertices are:\n` +
            `**${correctVerticesStr}**.`
        };
      }
    }
  }

  // Fallback (should not happen since switch covers all categories)
  return {
    id,
    category: 'TRANSLATION',
    shapeType: 'POINT',
    question: `Translate point A(0,0) by vector T = ⟨1,1⟩.`,
    hint: ``,
    formula: ``,
    inputType: 'coordinate',
    correctCoordinate: { x: 1, y: 1 },
    preImagePoint: { x: 0, y: 0 },
    explanation: ``
  };
}

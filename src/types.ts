export interface Point {
  x: number;
  y: number;
}

export type ProblemCategory = 'TRANSLATION' | 'REFLECTION' | 'ROTATION';

export interface Problem {
  id: string;
  category: ProblemCategory;
  shapeType: 'POINT' | 'POLYGON';
  question: string;
  hint: string;
  formula: string;
  inputType: 'coordinate' | 'quadrant' | 'numeric' | 'polygon';
  options?: string[];
  correctCoordinate?: Point;
  correctPolygon?: Point[];
  correctQuadrant?: string;
  correctNumeric?: number;
  preImagePoint: Point;
  preImagePolygon?: Point[];
  imagePoint?: Point;
  imagePolygon?: Point[];
  transformationDetails?: TransformationDetails;
  explanation: string;
}

export interface TransformationDetails {
  type: ProblemCategory;
  dx?: number;
  dy?: number;
  axis?: 'x-axis' | 'y-axis' | 'origin' | 'y=x' | 'y=-x' | 'x=k' | 'y=k';
  lineConstant?: number; // k in x=k or y=k
  angle?: 90 | 180 | 270;
  clockwise?: boolean;
  scaleFactor?: number;
}


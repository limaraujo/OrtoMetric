export interface Point {
  x: number;
  y: number;
  id: string;
}

export interface Line {
  start: Point;
  end: Point;
  id: string;
}

export interface CobbMeasurement {
  id: string;
  upperLine: Line;
  lowerLine: Line;
  measurementTypeId: string;
  angle: number;
  timestamp: Date;
  labelX?: number;
  labelY?: number;
  lineColor?: string;
  lineWidth?: number;
  labelFontSize?: number;
}

export interface DistanceMeasurement {
  id: string;
  line: Line;
  measurementTypeId: string;
  distance: number;
  timestamp: Date;
  labelX?: number;
  labelY?: number;
  lineColor?: string;
  lineWidth?: number;
  labelFontSize?: number;
}

export interface DistanceCalibration {
  pixelsPerUnit: number;
  unit: string;
}

export type Measurement = CobbMeasurement | DistanceMeasurement;

export function isCobb(m: Measurement): m is CobbMeasurement {
  return 'upperLine' in m && 'lowerLine' in m && 'angle' in m;
}

export function isDistance(m: Measurement): m is DistanceMeasurement {
  return 'line' in m && 'distance' in m;
}

export interface ImageTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
  brightness: number;
  contrast: number;
  invert: boolean;
}

export interface MeasurementState {
  points: Point[];
  measurements: Measurement[];
  draftMeasurementTypeId: string | null;
  activeTool: 'none' | 'angle' | 'distance' | 'pan';
  isDragging: boolean;
  draggedPointId: string | null;
  draggedLabelId: string | null;
}

export type HistoryAction = {
  type: 'add_point' | 'move_point' | 'remove_point' | 'clear_all' | 'add_measurement' | 'remove_measurement' | 'update_measurement_style';
  payload: any;
  previousState: MeasurementState;
};

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
  angle: number;
  timestamp: Date;
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
  measurements: CobbMeasurement[];
  activeTool: 'none' | 'cobb' | 'pan';
  isDragging: boolean;
  draggedPointId: string | null;
}

export type HistoryAction = {
  type: 'add_point' | 'move_point' | 'remove_point' | 'clear_all' | 'add_measurement';
  payload: any;
  previousState: MeasurementState;
};

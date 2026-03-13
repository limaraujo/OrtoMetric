import { useState, useCallback, useRef } from 'react';
import type { Point, CobbMeasurement, MeasurementState, HistoryAction } from '../types/measurement';

const generateId = () => Math.random().toString(36).substr(2, 9);

const calculateAngle = (line1Start: Point, line1End: Point, line2Start: Point, line2End: Point): number => {
  // Calculate direction vectors
  const v1x = line1End.x - line1Start.x;
  const v1y = line1End.y - line1Start.y;
  const v2x = line2End.x - line2Start.x;
  const v2y = line2End.y - line2Start.y;

  // Calculate perpendicular lines (normals)
  const n1x = -v1y;
  const n1y = v1x;
  const n2x = -v2y;
  const n2y = v2x;

  // Dot product of normals
  const dot = n1x * n2x + n1y * n2y;
  const mag1 = Math.sqrt(n1x * n1x + n1y * n1y);
  const mag2 = Math.sqrt(n2x * n2x + n2y * n2y);

  // Angle between normals (which equals angle between lines)
  const cosAngle = dot / (mag1 * mag2);
  const angle = Math.acos(Math.min(Math.max(cosAngle, -1), 1));

  // Convert to degrees
  return Math.abs(angle * (180 / Math.PI));
};

const INITIAL_STATE: MeasurementState = {
  points: [],
  measurements: [],
  activeTool: 'none',
  isDragging: false,
  draggedPointId: null,
};

export function useMeasurement() {
  const [state, setState] = useState<MeasurementState>(INITIAL_STATE);
  const historyRef = useRef<HistoryAction[]>([]);
  const historyIndexRef = useRef(-1);

  const saveHistory = useCallback((action: HistoryAction) => {
    // Remove any future history if we're not at the end
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(action);
    historyIndexRef.current = historyRef.current.length - 1;
  }, []);

  const addPoint = useCallback((x: number, y: number) => {
    if (state.activeTool !== 'cobb') return null;
    if (state.points.length >= 4) return null;

    const newPoint: Point = { x, y, id: generateId() };
    
    setState(prev => {
      const newPoints = [...prev.points, newPoint];
      
      // If we have 4 points, create a measurement
      if (newPoints.length === 4) {
        if (newPoints[0].x > newPoints[1].x) {
          // Ensure upper line is always from left to right
          [newPoints[0], newPoints[1]] = [newPoints[1], newPoints[0]];
        }
        if (newPoints[2].x > newPoints[3].x) {
          // Ensure lower line is always from left to right
          [newPoints[2], newPoints[3]] = [newPoints[3], newPoints[2]];
        }


        const measurement: CobbMeasurement = {
          id: generateId(),
          upperLine: {
            id: generateId(),
            start: newPoints[0],
            end: newPoints[1],
          },
          lowerLine: {
            id: generateId(),
            start: newPoints[2],
            end: newPoints[3],
          },
          angle: calculateAngle(newPoints[0], newPoints[1], newPoints[2], newPoints[3]),
          timestamp: new Date(),
        };

        saveHistory({
          type: 'add_measurement',
          payload: measurement,
          previousState: prev,
        });

        return {
          ...prev,
          points: [],
          measurements: [...prev.measurements, measurement],
          activeTool: 'none',
        };
      }

      saveHistory({
        type: 'add_point',
        payload: newPoint,
        previousState: prev,
      });

      return { ...prev, points: newPoints };
    });

    return newPoint;
  }, [state.activeTool, state.points.length, saveHistory]);

  const movePoint = useCallback((pointId: string, x: number, y: number) => {
    setState(prev => {
      // Check if point is in current points
      const pointIndex = prev.points.findIndex(p => p.id === pointId);
      if (pointIndex !== -1) {
        const newPoints = [...prev.points];
        newPoints[pointIndex] = { ...newPoints[pointIndex], x, y };
        return { ...prev, points: newPoints };
      }

      // Check if point is in measurements
      const newMeasurements = prev.measurements.map(m => {
        let updated = { ...m };
        if (m.upperLine.start.id === pointId) {
          updated.upperLine = { ...m.upperLine, start: { ...m.upperLine.start, x, y } };
        } else if (m.upperLine.end.id === pointId) {
          updated.upperLine = { ...m.upperLine, end: { ...m.upperLine.end, x, y } };
        } else if (m.lowerLine.start.id === pointId) {
          updated.lowerLine = { ...m.lowerLine, start: { ...m.lowerLine.start, x, y } };
        } else if (m.lowerLine.end.id === pointId) {
          updated.lowerLine = { ...m.lowerLine, end: { ...m.lowerLine.end, x, y } };
        }
        
        // Recalculate angle if any point was moved
        if (updated !== m) {
          updated.angle = calculateAngle(
            updated.upperLine.start,
            updated.upperLine.end,
            updated.lowerLine.start,
            updated.lowerLine.end
          );
        }
        
        return updated;
      });

      return { ...prev, measurements: newMeasurements };
    });
  }, []);

  const startDrag = useCallback((pointId: string) => {
    setState(prev => ({ ...prev, isDragging: true, draggedPointId: pointId }));
  }, []);

  const endDrag = useCallback(() => {
    setState(prev => {
      if (prev.isDragging && prev.draggedPointId) {
        saveHistory({
          type: 'move_point',
          payload: prev.draggedPointId,
          previousState: prev,
        });
      }
      return { ...prev, isDragging: false, draggedPointId: null };
    });
  }, [saveHistory]);

  const setActiveTool = useCallback((tool: 'none' | 'cobb' | 'pan') => {
    setState(prev => ({ ...prev, activeTool: tool, points: [] }));
  }, []);

  const clearAll = useCallback(() => {
    saveHistory({
      type: 'clear_all',
      payload: null,
      previousState: state,
    });
    setState(INITIAL_STATE);
  }, [state, saveHistory]);

  const undo = useCallback(() => {
    if (historyIndexRef.current < 0) return;
    const action = historyRef.current[historyIndexRef.current];
    setState(action.previousState);
    historyIndexRef.current--;
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current++;
    const action = historyRef.current[historyIndexRef.current];
    
    // Re-apply the action
    switch (action.type) {
      case 'add_point':
        setState(prev => ({
          ...prev,
          points: [...prev.points, action.payload],
        }));
        break;
      case 'add_measurement':
        setState(prev => ({
          ...prev,
          points: [],
          measurements: [...prev.measurements, action.payload as CobbMeasurement],
          activeTool: 'none',
        }));
        break;
      case 'clear_all':
        setState(INITIAL_STATE);
        break;
    }
  }, []);

  const canUndo = historyIndexRef.current >= 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;

  return {
    state,
    addPoint,
    movePoint,
    startDrag,
    endDrag,
    setActiveTool,
    clearAll,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}

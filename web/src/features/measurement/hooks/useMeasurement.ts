import { useState, useCallback, useRef } from 'react';
import type { Point, CobbMeasurement, DistanceMeasurement, Measurement, MeasurementState, HistoryAction } from '../types/measurement';
import { isCobb, isDistance } from '../types/measurement';

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

const calculateDistance = (p1: Point, p2: Point): number => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const INITIAL_STATE: MeasurementState = {
  points: [],
  measurements: [],
  draftMeasurementTypeId: null,
  activeTool: 'none',
  isDragging: false,
  draggedPointId: null,
  draggedLabelId: null,
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

  const addPoint = useCallback((x: number, y: number, measurementTypeId?: string) => {
    if (state.activeTool === 'none' || state.activeTool === 'pan') return null;

    // For angle: max 4 points, for distance: max 2 points
    const maxPoints = state.activeTool === 'angle' ? 4 : 2;
    if (state.points.length >= maxPoints) return null;

    const newPoint: Point = { x, y, id: generateId() };

    setState(prev => {
      const newPoints = [...prev.points, newPoint];
      const nextDraftTypeId = prev.draftMeasurementTypeId ?? measurementTypeId ?? '';

      // Check if we need to create a measurement
      if (prev.activeTool === 'angle' && newPoints.length === 4) {
        // Angle measurement with 4 points
        if (newPoints[0].x > newPoints[1].x) {
          // Ensure upper line is always from left to right
          [newPoints[0], newPoints[1]] = [newPoints[1], newPoints[0]];
        }
        if (newPoints[2].x > newPoints[3].x) {
          // Ensure lower line is always from left to right
          [newPoints[2], newPoints[3]] = [newPoints[3], newPoints[2]];
        }

        const cobbMeasurement: CobbMeasurement = {
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
          measurementTypeId: nextDraftTypeId,
          angle: calculateAngle(newPoints[0], newPoints[1], newPoints[2], newPoints[3]),
          timestamp: new Date(),
        };

        saveHistory({
          type: 'add_measurement',
          payload: cobbMeasurement,
          previousState: prev,
        });

        return {
          ...prev,
          points: [],
          draftMeasurementTypeId: null,
          measurements: [...prev.measurements, cobbMeasurement],
          activeTool: 'none',
        };
      } else if (prev.activeTool === 'distance' && newPoints.length === 2) {
        // Distance measurement with 2 points
        const distance = calculateDistance(newPoints[0], newPoints[1]);

        const distanceMeasurement: DistanceMeasurement = {
          id: generateId(),
          line: {
            id: generateId(),
            start: newPoints[0],
            end: newPoints[1],
          },
          measurementTypeId: nextDraftTypeId,
          distance,
          timestamp: new Date(),
        };

        saveHistory({
          type: 'add_measurement',
          payload: distanceMeasurement,
          previousState: prev,
        });

        return {
          ...prev,
          points: [],
          draftMeasurementTypeId: null,
          measurements: [...prev.measurements, distanceMeasurement],
          activeTool: 'none',
        };
      }

      // Still collecting points
      saveHistory({
        type: 'add_point',
        payload: newPoint,
        previousState: prev,
      });

      return {
        ...prev,
        points: newPoints,
        draftMeasurementTypeId: nextDraftTypeId,
      };
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
        if (isCobb(m)) {
          let updated: CobbMeasurement = m;

          // Handle Cobb/angle measurement
          if (m.upperLine.start.id === pointId) {
            updated = { ...m, upperLine: { ...m.upperLine, start: { ...m.upperLine.start, x, y } } };
          } else if (m.upperLine.end.id === pointId) {
            updated = { ...m, upperLine: { ...m.upperLine, end: { ...m.upperLine.end, x, y } } };
          } else if (m.lowerLine.start.id === pointId) {
            updated = { ...m, lowerLine: { ...m.lowerLine, start: { ...m.lowerLine.start, x, y } } };
          } else if (m.lowerLine.end.id === pointId) {
            updated = { ...m, lowerLine: { ...m.lowerLine, end: { ...m.lowerLine.end, x, y } } };
          }

          if (updated !== m) {
            return {
              ...updated,
              angle: calculateAngle(
                updated.upperLine.start,
                updated.upperLine.end,
                updated.lowerLine.start,
                updated.lowerLine.end
              ),
            };
          }

          return m;
        }

        if (isDistance(m)) {
          let updated: DistanceMeasurement = m;

          // Handle distance measurement
          if (m.line.start.id === pointId) {
            updated = { ...m, line: { ...m.line, start: { ...m.line.start, x, y } } };
          } else if (m.line.end.id === pointId) {
            updated = { ...m, line: { ...m.line, end: { ...m.line.end, x, y } } };
          }

          if (updated !== m) {
            return {
              ...updated,
              distance: calculateDistance(updated.line.start, updated.line.end),
            };
          }

          return m;
        }

        return m;
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

  const setActiveTool = useCallback((tool: 'none' | 'angle' | 'distance' | 'pan') => {
    setState(prev => ({ ...prev, activeTool: tool, points: [], draftMeasurementTypeId: null }));
  }, []);

  const startAngleLabelDrag = useCallback((measurementId: string) => {
    setState(prev => ({ ...prev, draggedLabelId: measurementId }));
  }, []);

  const endAngleLabelDrag = useCallback(() => {
    setState(prev => ({ ...prev, draggedLabelId: null }));
  }, []);

  const moveAngleLabel = useCallback((measurementId: string, x: number, y: number) => {
    setState(prev => ({
      ...prev,
      measurements: prev.measurements.map(m =>
        m.id === measurementId ? { ...m, labelX: x, labelY: y } : m
      ),
    }));
  }, []);

  const updateMeasurementStyle = useCallback((measurementId: string, lineColor: string, lineWidth: number) => {
    setState(prev => {
      const nextLineWidth = Math.max(1, Math.min(12, lineWidth));
      const updatedMeasurements = prev.measurements.map(m =>
        m.id === measurementId ? { ...m, lineColor, lineWidth: nextLineWidth } : m
      );
      const updatedMeasurement = updatedMeasurements.find(m => m.id === measurementId);

      if (!updatedMeasurement) return prev;

      saveHistory({
        type: 'update_measurement_style',
        payload: updatedMeasurement,
        previousState: prev,
      });

      return {
        ...prev,
        measurements: updatedMeasurements,
      };
    });
  }, [saveHistory]);

  const updateMeasurementLabelFontSize = useCallback((measurementId: string, fontSize: number) => {
    setState(prev => {
      const nextFontSize = Math.max(10, Math.min(64, fontSize));
      const updatedMeasurements = prev.measurements.map(m =>
        m.id === measurementId ? { ...m, labelFontSize: nextFontSize } : m
      );
      const updatedMeasurement = updatedMeasurements.find(m => m.id === measurementId);

      if (!updatedMeasurement) return prev;

      saveHistory({
        type: 'update_measurement_style',
        payload: updatedMeasurement,
        previousState: prev,
      });

      return {
        ...prev,
        measurements: updatedMeasurements,
      };
    });
  }, [saveHistory]);

  const removeMeasurement = useCallback((measurementId: string) => {
    setState(prev => {
      const target = prev.measurements.find(m => m.id === measurementId);
      if (!target) return prev;

      saveHistory({
        type: 'remove_measurement',
        payload: target,
        previousState: prev,
      });

      return {
        ...prev,
        measurements: prev.measurements.filter(m => m.id !== measurementId),
      };
    });
  }, [saveHistory]);

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
          draftMeasurementTypeId: null,
          measurements: [...prev.measurements, action.payload as Measurement],
          activeTool: 'none',
        }));
        break;
      case 'clear_all':
        setState(INITIAL_STATE);
        break;
      case 'remove_measurement':
        setState(prev => ({
          ...prev,
          measurements: prev.measurements.filter(m => m.id !== (action.payload as Measurement).id),
        }));
        break;
      case 'update_measurement_style':
        setState(prev => ({
          ...prev,
          measurements: prev.measurements.map(m =>
            m.id === (action.payload as Measurement).id ? (action.payload as Measurement) : m
          ),
        }));
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
    startAngleLabelDrag,
    endAngleLabelDrag,
    moveAngleLabel,
    updateMeasurementStyle,
    updateMeasurementLabelFontSize,
    removeMeasurement,
    clearAll,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}

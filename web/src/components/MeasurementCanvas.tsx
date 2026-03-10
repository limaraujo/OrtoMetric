import { useRef, useEffect, useCallback, useState } from 'react';
import type { Point, CobbMeasurement, ImageTransform } from '../types/measurement';

interface MeasurementCanvasProps {
  image: HTMLImageElement | null;
  transform: ImageTransform;
  points: Point[];
  measurements: CobbMeasurement[];
  activeTool: 'none' | 'cobb' | 'pan';
  onAddPoint: (x: number, y: number) => void;
  onMovePoint: (pointId: string, x: number, y: number) => void;
  onStartDrag: (pointId: string) => void;
  onEndDrag: () => void;
  isPanning: boolean;
  onStartPan: (x: number, y: number) => void;
  onUpdatePan: (x: number, y: number) => void;
  onEndPan: () => void;
  onWheel: (e: WheelEvent) => void;
}

export function MeasurementCanvas({
  image,
  transform,
  points,
  measurements,
  activeTool,
  onAddPoint,
  onMovePoint,
  onStartDrag,
  onEndDrag,
  isPanning,
  onStartPan,
  onUpdatePan,
  onEndPan,
  onWheel,
}: MeasurementCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [draggedPoint, setDraggedPoint] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Update container size on resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Handle wheel events
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  // Draw image with transformations
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = containerSize.width;
    canvas.height = containerSize.height;

    // Clear canvas
    ctx.fillStyle = 'hsl(220, 20%, 8%)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply transformations
    ctx.save();
    ctx.translate(canvas.width / 2 + transform.offsetX, canvas.height / 2 + transform.offsetY);
    ctx.scale(transform.scale, transform.scale);

    // Apply filters
    ctx.filter = `brightness(${transform.brightness}%) contrast(${transform.contrast}%)${transform.invert ? ' invert(100%)' : ''}`;

    // Calculate image dimensions to fit container
    const imgRatio = image.width / image.height;
    const containerRatio = containerSize.width / containerSize.height;
    let drawWidth, drawHeight;

    if (imgRatio > containerRatio) {
      drawWidth = containerSize.width * 0.9;
      drawHeight = drawWidth / imgRatio;
    } else {
      drawHeight = containerSize.height * 0.9;
      drawWidth = drawHeight * imgRatio;
    }

    ctx.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();

    // Reset filter for drawing measurements
    ctx.filter = 'none';

    // Draw measurement lines and points
    const drawLine = (start: { x: number; y: number }, end: { x: number; y: number }, color: string, dash: number[] = []) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash(dash);
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const drawExtendedLine = (start: { x: number; y: number }, end: { x: number; y: number }, color: string) => {
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const extendFactor = 500 / len;
      
      const extStart = {
        x: start.x - dx * extendFactor,
        y: start.y - dy * extendFactor,
      };
      const extEnd = {
        x: end.x + dx * extendFactor,
        y: end.y + dy * extendFactor,
      };

      drawLine(extStart, extEnd, color, [5, 5]);
    };

    const drawPoint = (point: Point, index: number) => {
      ctx.beginPath();
      ctx.fillStyle = 'hsl(0, 84%, 60%)';
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Draw label
      ctx.fillStyle = 'white';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`P${index + 1}`, point.x, point.y);
    };

    // Draw current points
    points.forEach((point, index) => {
      drawPoint(point, index);
      if (index > 0 && index % 2 === 1) {
        drawLine(points[index - 1], point, 'hsl(48, 96%, 53%)');
        drawExtendedLine(points[index - 1], point, 'hsl(48, 96%, 53%)');
      }
    });

    // Draw completed measurements
    measurements.forEach((m) => {
      // Draw lines
      drawLine(m.upperLine.start, m.upperLine.end, 'hsl(48, 96%, 53%)');
      drawExtendedLine(m.upperLine.start, m.upperLine.end, 'hsl(48, 96%, 53%)');
      drawLine(m.lowerLine.start, m.lowerLine.end, 'hsl(48, 96%, 53%)');
      drawExtendedLine(m.lowerLine.start, m.lowerLine.end, 'hsl(48, 96%, 53%)');

      // Draw points
      drawPoint(m.upperLine.start, 0);
      drawPoint(m.upperLine.end, 1);
      drawPoint(m.lowerLine.start, 2);
      drawPoint(m.lowerLine.end, 3);

      // Draw angle label
      const centerX = (m.upperLine.start.x + m.upperLine.end.x + m.lowerLine.start.x + m.lowerLine.end.x) / 4;
      const centerY = (m.upperLine.start.y + m.upperLine.end.y + m.lowerLine.start.y + m.lowerLine.end.y) / 4;

      ctx.fillStyle = 'hsl(199, 89%, 48%)';
      ctx.beginPath();
      ctx.roundRect(centerX - 40, centerY - 15, 80, 30, 6);
      ctx.fill();

      ctx.fillStyle = 'hsl(220, 20%, 10%)';
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${m.angle.toFixed(1)}°`, centerX, centerY);
    });

  }, [image, transform, points, measurements, containerSize]);

  const getCanvasCoordinates = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const findPointAtPosition = useCallback((x: number, y: number): string | null => {
    const threshold = 15;

    // Check current points
    for (const point of points) {
      const dist = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
      if (dist < threshold) return point.id;
    }

    // Check measurement points
    for (const m of measurements) {
      for (const point of [m.upperLine.start, m.upperLine.end, m.lowerLine.start, m.lowerLine.end]) {
        const dist = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
        if (dist < threshold) return point.id;
      }
    }

    return null;
  }, [points, measurements]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const { x, y } = getCanvasCoordinates(e);
    
    // Check if clicking on a point
    const pointId = findPointAtPosition(x, y);
    if (pointId) {
      setDraggedPoint(pointId);
      onStartDrag(pointId);
      return;
    }

    // Pan mode
    if (activeTool === 'pan' || e.button === 1) {
      onStartPan(e.clientX, e.clientY);
      return;
    }

    // Add point in cobb mode
    if (activeTool === 'cobb' && points.length < 4) {
      onAddPoint(x, y);
    }
  }, [activeTool, points.length, getCanvasCoordinates, findPointAtPosition, onAddPoint, onStartDrag, onStartPan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggedPoint) {
      const { x, y } = getCanvasCoordinates(e);
      onMovePoint(draggedPoint, x, y);
    } else if (isPanning) {
      onUpdatePan(e.clientX, e.clientY);
    }
  }, [draggedPoint, isPanning, getCanvasCoordinates, onMovePoint, onUpdatePan]);

  const handleMouseUp = useCallback(() => {
    if (draggedPoint) {
      setDraggedPoint(null);
      onEndDrag();
    }
    if (isPanning) {
      onEndPan();
    }
  }, [draggedPoint, isPanning, onEndDrag, onEndPan]);

  const getCursor = () => {
    if (draggedPoint) return 'grabbing';
    if (isPanning) return 'grabbing';
    if (activeTool === 'pan') return 'grab';
    if (activeTool === 'cobb' && points.length < 4) return 'crosshair';
    return 'default';
  };

  return (
    <div
      ref={containerRef}
      className="canvas-container w-full h-full min-h-[400px] lg:min-h-[600px]"
      style={{ cursor: getCursor() }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-full"
      />
      
      {/* Instruction overlay */}
      {activeTool === 'cobb' && points.length < 4 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-border shadow-lg animate-fade-in">
          <p className="text-sm text-foreground">
            {points.length === 0 && 'Clique para marcar P1 (início da linha superior)'}
            {points.length === 1 && 'Clique para marcar P2 (fim da linha superior)'}
            {points.length === 2 && 'Clique para marcar P3 (início da linha inferior)'}
            {points.length === 3 && 'Clique para marcar P4 (fim da linha inferior)'}
          </p>
        </div>
      )}
    </div>
  );
}

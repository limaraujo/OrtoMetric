import { useRef, useEffect, useCallback, useState } from "react";
import type { Point, CobbMeasurement } from "../types/measurement";

const LINE_WIDTH = 3;
const POINT_RADIUS = 8;
const POINT_BORDER = 2;

interface MeasurementCanvasProps {
  points: Point[];
  measurements: CobbMeasurement[];
  activeTool: "none" | "cobb" | "pan";
  zoom: number;
  panX: number;
  panY: number;
  cursor: string;
  onAddPoint: (x: number, y: number) => void;
  onMovePoint: (pointId: string, x: number, y: number) => void;
  onStartDrag: (pointId: string) => void;
  onEndDrag: () => void;
}

export function MeasurementCanvas({
  points,
  measurements,
  activeTool,
  zoom,
  panX,
  panY,
  cursor,
  onAddPoint,
  onMovePoint,
  onStartDrag,
  onEndDrag,
}: MeasurementCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [draggedPoint, setDraggedPoint] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  /*
  ========================
  Resize observer
  ========================
  */

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setContainerSize({ width, height });
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  /*
  ========================
  Canvas render
  ========================
  */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    const W = containerSize.width;
    const H = containerSize.height;

    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;

    // Clear at identity so the full physical buffer is wiped
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!W || !H) return;

    // Draw in screen space (with DPR only), mapping world coordinates manually.
    // This keeps line/point sizes fixed in px regardless of zoom.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const snap = (v: number) => Math.round(v * dpr) / dpr;
    const toScreen = (p: { x: number; y: number }) => ({
      x: (p.x - W / 2) * zoom + W / 2 + panX,
      y: (p.y - H / 2) * zoom + H / 2 + panY,
    });

    /*
    ========================
    Helpers
    ========================
    */

    const drawLine = (
      start: { x: number; y: number },
      end: { x: number; y: number },
      color: string,
      dash: number[] = []
    ) => {
      const s = toScreen(start);
      const e = toScreen(end);

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = LINE_WIDTH;
      ctx.setLineDash(dash);
      ctx.moveTo(snap(s.x), snap(s.y));
      ctx.lineTo(snap(e.x), snap(e.y));
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const drawExtendedLine = (
      start: { x: number; y: number },
      end: { x: number; y: number },
      color: string
    ) => {
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const extendFactor = 500 / len;
      drawLine(
        { x: start.x - dx * extendFactor, y: start.y - dy * extendFactor },
        { x: end.x   + dx * extendFactor, y: end.y   + dy * extendFactor },
        color,
        [5, 5]
      );
    };

    const drawPoint = (point: Point, index: number) => {
      const p = toScreen(point);

      ctx.beginPath();
      ctx.fillStyle = "hsl(0, 84%, 60%)";
      ctx.strokeStyle = "white";
      ctx.lineWidth = POINT_BORDER;
      ctx.arc(snap(p.x), snap(p.y), POINT_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "white";
      ctx.font = `bold 10px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`P${index + 1}`, snap(p.x), snap(p.y));
    };

    /*
    ========================
    Current points
    ========================
    */

    points.forEach((point, index) => {
      drawPoint(point, index);

      if (index > 0 && index % 2 === 1) {
        drawLine(points[index - 1], point, "hsl(48,96%,53%)");
        drawExtendedLine(points[index - 1], point, "hsl(48,96%,53%)");
      }
    });

    /*
    ========================
    Measurements
    ========================
    */

    measurements.forEach((m) => {
      drawLine(m.upperLine.start, m.upperLine.end, "hsl(48,96%,53%)");
      drawExtendedLine(m.upperLine.start, m.upperLine.end, "hsl(48,96%,53%)");

      drawLine(m.lowerLine.start, m.lowerLine.end, "hsl(48,96%,53%)");
      drawExtendedLine(m.lowerLine.start, m.lowerLine.end, "hsl(48,96%,53%)");

      drawPoint(m.upperLine.start, 0);
      drawPoint(m.upperLine.end, 1);
      drawPoint(m.lowerLine.start, 2);
      drawPoint(m.lowerLine.end, 3);

      const center = toScreen({
        x: (m.upperLine.start.x + m.upperLine.end.x +
            m.lowerLine.start.x + m.lowerLine.end.x) / 4,
        y: (m.upperLine.start.y + m.upperLine.end.y +
            m.lowerLine.start.y + m.lowerLine.end.y) / 4,
      });

      ctx.fillStyle = "hsl(199,89%,48%)";
      ctx.beginPath();
      ctx.roundRect(snap(center.x) - 40, snap(center.y) - 15, 80, 30, 6);
      ctx.fill();

      ctx.fillStyle = "hsl(220,20%,10%)";
      ctx.font = "bold 14px Inter";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${m.angle.toFixed(1)}°`, snap(center.x), snap(center.y));
    });
  }, [points, measurements, containerSize, zoom, panX, panY]);

  /*
  ========================
  Mouse coordinates
  ========================
  */

  const getCanvasCoordinates = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return { x: 0, y: 0 };

      const rect = containerRef.current.getBoundingClientRect();
      const W = containerRef.current.clientWidth;
      const H = containerRef.current.clientHeight;
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

      // Inverse of: translate(panX,panY) scale(zoom) with transform-origin:center
      return {
        x: (cx - panX - W / 2) / zoom + W / 2,
        y: (cy - panY - H / 2) / zoom + H / 2,
      };
    },
    [zoom, panX, panY]
  );

  /*
  ========================
  Point detection
  ========================
  */

  const findPointAtPosition = useCallback(
    (x: number, y: number): string | null => {
      const threshold = 15 / zoom;

      for (const point of points) {
        const dist = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
        if (dist < threshold) return point.id;
      }

      for (const m of measurements) {
        for (const point of [
          m.upperLine.start,
          m.upperLine.end,
          m.lowerLine.start,
          m.lowerLine.end,
        ]) {
          const dist = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
          if (dist < threshold) return point.id;
        }
      }

      return null;
    },
    [points, measurements, zoom]
  );

  /*
  ========================
  Mouse handlers
  ========================
  */

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const { x, y } = getCanvasCoordinates(e);

      const pointId = findPointAtPosition(x, y);

      if (pointId) {
        setDraggedPoint(pointId);
        onStartDrag(pointId);
        return;
      }

      if (activeTool === "cobb" && points.length < 4) {
        onAddPoint(x, y);
      }
    },
    [activeTool, points.length, getCanvasCoordinates, findPointAtPosition, onAddPoint, onStartDrag]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!draggedPoint) return;

      const { x, y } = getCanvasCoordinates(e);
      onMovePoint(draggedPoint, x, y);
    },
    [draggedPoint, getCanvasCoordinates, onMovePoint]
  );

  const handleMouseUp = useCallback(() => {
    if (!draggedPoint) return;

    setDraggedPoint(null);
    onEndDrag();
  }, [draggedPoint, onEndDrag]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{ cursor }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-full"
      />

      {activeTool === "cobb" && points.length < 4 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-border shadow-lg">
          <p className="text-sm text-foreground">
            {points.length === 0 && "Clique para marcar P1"}
            {points.length === 1 && "Clique para marcar P2"}
            {points.length === 2 && "Clique para marcar P3"}
            {points.length === 3 && "Clique para marcar P4"}
          </p>
        </div>
      )}
    </div>
  );
}
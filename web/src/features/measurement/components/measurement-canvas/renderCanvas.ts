import type { DistanceCalibration, Measurement, Point } from "../../types/measurement";
import { isCobb } from "../../types/measurement";
import {
    ANGLE_LABEL_COLOR,
    DEFAULT_ANGLE_FONT_SIZE,
    DEFAULT_DISTANCE_FONT_SIZE,
    LINE_WIDTH,
    POINT_BORDER,
    POINT_RADIUS,
} from "./constants";

type RenderParams = {
    canvas: HTMLCanvasElement;
    containerWidth: number;
    containerHeight: number;
    points: Point[];
    measurements: Measurement[];
    distanceCalibration: DistanceCalibration | null;
    zoom: number;
    panX: number;
    panY: number;
};

export function renderMeasurementCanvas({
    canvas,
    containerWidth,
    containerHeight,
    points,
    measurements,
    distanceCalibration,
    zoom,
    panX,
    panY,
}: RenderParams) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = containerWidth * dpr;
    canvas.height = containerHeight * dpr;
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${containerHeight}px`;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!containerWidth || !containerHeight) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const crisp = (v: number) => Math.round(v) + 0.5;
    const toScreen = (p: { x: number; y: number }) => ({
        x: (p.x - containerWidth / 2) * zoom + containerWidth / 2 + panX,
        y: (p.y - containerHeight / 2) * zoom + containerHeight / 2 + panY,
    });

    const scaledPointRadius = POINT_RADIUS * zoom;
    const scaledPointBorder = POINT_BORDER * zoom;
    const scaledPointFontSize = 10 * zoom;

    const drawLine = (
        start: { x: number; y: number },
        end: { x: number; y: number },
        color: string,
        lineWidth: number = LINE_WIDTH,
        dash: number[] = []
    ) => {
        const s = toScreen(start);
        const e = toScreen(end);

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth * zoom;
        ctx.setLineDash(dash);
        ctx.moveTo(crisp(s.x), crisp(s.y));
        ctx.lineTo(crisp(e.x), crisp(e.y));
        ctx.stroke();
        ctx.setLineDash([]);
    };

    const drawExtendedLine = (
        start: { x: number; y: number },
        end: { x: number; y: number },
        color: string,
        lineWidth: number = LINE_WIDTH
    ) => {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const extendFactor = 100 / len;

        drawLine(
            { x: start.x - dx * extendFactor, y: start.y - dy * extendFactor },
            { x: end.x + dx * extendFactor, y: end.y + dy * extendFactor },
            color,
            lineWidth,
            [5, 5]
        );
    };

    const drawPoint = (point: Point, index: number) => {
        const p = toScreen(point);
        const cx = crisp(p.x);
        const cy = crisp(p.y);

        ctx.beginPath();
        ctx.fillStyle = "hsl(0, 84%, 60%)";
        ctx.strokeStyle = "white";
        ctx.lineWidth = scaledPointBorder;
        ctx.arc(cx, cy, scaledPointRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "white";
        ctx.font = `bold ${scaledPointFontSize}px Inter, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`P${index + 1}`, cx, cy);
    };

    points.forEach((point, index) => {
        drawPoint(point, index);

        if (index > 0 && index % 2 === 1) {
            drawLine(points[index - 1], point, ANGLE_LABEL_COLOR);
            drawExtendedLine(points[index - 1], point, ANGLE_LABEL_COLOR);
        }
    });

    measurements.forEach((m) => {
        const measurementColor = m.lineColor ?? ANGLE_LABEL_COLOR;
        const measurementLineWidth = m.lineWidth ?? LINE_WIDTH;

        if (isCobb(m)) {
            drawLine(m.upperLine.start, m.upperLine.end, measurementColor, measurementLineWidth);
            drawExtendedLine(m.upperLine.start, m.upperLine.end, measurementColor, measurementLineWidth);
            drawLine(m.lowerLine.start, m.lowerLine.end, measurementColor, measurementLineWidth);
            drawExtendedLine(m.lowerLine.start, m.lowerLine.end, measurementColor, measurementLineWidth);

            drawPoint(m.upperLine.start, 0);
            drawPoint(m.upperLine.end, 1);
            drawPoint(m.lowerLine.start, 2);
            drawPoint(m.lowerLine.end, 3);

            const centerWorld = {
                x: (m.upperLine.start.x + m.upperLine.end.x + m.lowerLine.start.x + m.lowerLine.end.x) / 4,
                y: (m.upperLine.start.y + m.upperLine.end.y + m.lowerLine.start.y + m.lowerLine.end.y) / 4,
            };
            const labelWorld = {
                x: m.labelX ?? centerWorld.x,
                y: m.labelY ?? centerWorld.y,
            };
            const labelScreen = toScreen(labelWorld);

            ctx.fillStyle = measurementColor;
            ctx.font = `bold ${(m.labelFontSize ?? DEFAULT_ANGLE_FONT_SIZE) * zoom}px Inter`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(`${m.angle.toFixed(1)}°`, crisp(labelScreen.x), crisp(labelScreen.y));
            return;
        }

        drawLine(m.line.start, m.line.end, measurementColor, measurementLineWidth);
        drawPoint(m.line.start, 0);
        drawPoint(m.line.end, 1);

        const midWorld = {
            x: (m.line.start.x + m.line.end.x) / 2,
            y: (m.line.start.y + m.line.end.y) / 2,
        };
        const labelWorld = {
            x: m.labelX ?? midWorld.x,
            y: m.labelY ?? midWorld.y,
        };
        const labelScreen = toScreen(labelWorld);

        ctx.fillStyle = measurementColor;
        ctx.font = `bold ${(m.labelFontSize ?? DEFAULT_DISTANCE_FONT_SIZE) * zoom}px Inter`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const displayDistance = distanceCalibration
            ? m.distance / distanceCalibration.pixelsPerUnit
            : m.distance;
        const displayUnit = distanceCalibration?.unit ?? "px";
        ctx.fillText(`${displayDistance.toFixed(1)}${displayUnit}`, crisp(labelScreen.x), crisp(labelScreen.y));
    });
}

import type { DistanceCalibration, Measurement, Point } from "../../types/measurement";
import { isCobb } from "../../types/measurement";
import {
    ANGLE_LABEL_COLOR,
    DEFAULT_ANGLE_FONT_SIZE,
    DEFAULT_DISTANCE_FONT_SIZE,
    LINE_WIDTH,
    POINT_BORDER_COLOR,
    POINT_COLOR,
    POINT_BORDER,
    POINT_RADIUS,
    POINT_FONT_SIZE,
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

    const drawPoint = (
        point: Point,
        index: number,
        color = POINT_COLOR,
        radius = POINT_RADIUS,
        borderColor = POINT_BORDER_COLOR,
        borderWidth = POINT_BORDER,
        pointFontSize = POINT_FONT_SIZE,
        pointAppearance = "full",
        pointLabelVisible = true,
    ) => {
        if (pointAppearance === "hidden") {
            return;
        }

        const p = toScreen(point);
        const cx = crisp(p.x);
        const cy = crisp(p.y);
        const scaledRadius = Math.max(2, radius * zoom);
        const scaledBorderWidth = Math.max(1, borderWidth * zoom);
        const scaledPointFontSize = Math.max(8, pointFontSize * zoom);

        if (pointAppearance === "full" || pointAppearance === "center") {
            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.arc(cx, cy, scaledRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        if (pointAppearance === "full") {
            ctx.beginPath();
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = scaledBorderWidth;
            ctx.arc(cx, cy, scaledRadius, 0, Math.PI * 2);
            ctx.stroke();
        }

        if (!pointLabelVisible) {
            return;
        }

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
        const measurementPointColor = m.pointColor ?? POINT_COLOR;
        const measurementPointSize = m.pointSize ?? POINT_RADIUS;
        const measurementPointBorderColor = m.pointBorderColor ?? POINT_BORDER_COLOR;
        const measurementPointBorderWidth = m.pointBorderWidth ?? POINT_BORDER;
        const measurementPointFontSize = m.pointFontSize ?? POINT_FONT_SIZE;
        const measurementPointAppearance = m.pointAppearance ?? "full";
        const measurementPointLabelVisible = m.pointLabelVisible ?? true;

        if (isCobb(m)) {
            drawLine(m.upperLine.start, m.upperLine.end, measurementColor, measurementLineWidth);
            drawExtendedLine(m.upperLine.start, m.upperLine.end, measurementColor, measurementLineWidth);
            drawLine(m.lowerLine.start, m.lowerLine.end, measurementColor, measurementLineWidth);
            drawExtendedLine(m.lowerLine.start, m.lowerLine.end, measurementColor, measurementLineWidth);

            drawPoint(
                m.upperLine.start,
                0,
                measurementPointColor,
                measurementPointSize,
                measurementPointBorderColor,
                measurementPointBorderWidth,
                measurementPointFontSize,
                measurementPointAppearance,
                measurementPointLabelVisible,
            );
            drawPoint(
                m.upperLine.end,
                1,
                measurementPointColor,
                measurementPointSize,
                measurementPointBorderColor,
                measurementPointBorderWidth,
                measurementPointFontSize,
                measurementPointAppearance,
                measurementPointLabelVisible,
            );
            drawPoint(
                m.lowerLine.start,
                2,
                measurementPointColor,
                measurementPointSize,
                measurementPointBorderColor,
                measurementPointBorderWidth,
                measurementPointFontSize,
                measurementPointAppearance,
                measurementPointLabelVisible,
            );
            drawPoint(
                m.lowerLine.end,
                3,
                measurementPointColor,
                measurementPointSize,
                measurementPointBorderColor,
                measurementPointBorderWidth,
                measurementPointFontSize,
                measurementPointAppearance,
                measurementPointLabelVisible,
            );

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
        drawPoint(
            m.line.start,
            0,
            measurementPointColor,
            measurementPointSize,
            measurementPointBorderColor,
            measurementPointBorderWidth,
            measurementPointFontSize,
            measurementPointAppearance,
            measurementPointLabelVisible,
        );
        drawPoint(
            m.line.end,
            1,
            measurementPointColor,
            measurementPointSize,
            measurementPointBorderColor,
            measurementPointBorderWidth,
            measurementPointFontSize,
            measurementPointAppearance,
            measurementPointLabelVisible,
        );

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

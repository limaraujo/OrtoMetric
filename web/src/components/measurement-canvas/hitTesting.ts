import type { Point, Measurement } from "../../types/measurement";
import { isCobb, isDistance } from "../../types/measurement";
import { ANGLE_LABEL_HIT_THRESHOLD } from "./constants";
import { getMeasurementLabelCenter, getMeasurementLabelFontSize } from "./labelUtils";

function distanceBetween(ax: number, ay: number, bx: number, by: number) {
    return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

function distanceToSegment(
    px: number,
    py: number,
    ax: number,
    ay: number,
    bx: number,
    by: number
): number {
    const abx = bx - ax;
    const aby = by - ay;
    const apx = px - ax;
    const apy = py - ay;
    const abLenSq = abx * abx + aby * aby;

    if (abLenSq === 0) {
        return distanceBetween(px, py, ax, ay);
    }

    const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / abLenSq));
    const cx = ax + abx * t;
    const cy = ay + aby * t;
    return distanceBetween(px, py, cx, cy);
}

export function findPointAtPosition(
    points: Point[],
    measurements: Measurement[],
    x: number,
    y: number,
    zoom: number
): string | null {
    const threshold = 15 / zoom;

    for (const point of points) {
        if (distanceBetween(point.x, point.y, x, y) < threshold) return point.id;
    }

    for (const m of measurements) {
        const pointsToCheck: Point[] = isCobb(m)
            ? [m.upperLine.start, m.upperLine.end, m.lowerLine.start, m.lowerLine.end]
            : [m.line.start, m.line.end];

        for (const point of pointsToCheck) {
            if (distanceBetween(point.x, point.y, x, y) < threshold) return point.id;
        }
    }

    return null;
}

export function findMeasurementLabelAtPosition(
    measurements: Measurement[],
    x: number,
    y: number,
    zoom: number
): string | null {
    for (const m of measurements) {
        const center = getMeasurementLabelCenter(m);
        const lx = m.labelX ?? center.x;
        const ly = m.labelY ?? center.y;
        const threshold = Math.max(ANGLE_LABEL_HIT_THRESHOLD, getMeasurementLabelFontSize(m)) / zoom;
        if (distanceBetween(x, y, lx, ly) < threshold) return m.id;
    }

    return null;
}

export function findMeasurementLineAtPosition(
    measurements: Measurement[],
    x: number,
    y: number,
    zoom: number
): string | null {
    const threshold = 10 / zoom;

    for (let i = measurements.length - 1; i >= 0; i -= 1) {
        const m = measurements[i];

        if (isCobb(m)) {
            const upperDistance = distanceToSegment(
                x,
                y,
                m.upperLine.start.x,
                m.upperLine.start.y,
                m.upperLine.end.x,
                m.upperLine.end.y
            );
            const lowerDistance = distanceToSegment(
                x,
                y,
                m.lowerLine.start.x,
                m.lowerLine.start.y,
                m.lowerLine.end.x,
                m.lowerLine.end.y
            );

            if (upperDistance < threshold || lowerDistance < threshold) return m.id;
        }

        if (isDistance(m)) {
            const lineDistance = distanceToSegment(
                x,
                y,
                m.line.start.x,
                m.line.start.y,
                m.line.end.x,
                m.line.end.y
            );
            if (lineDistance < threshold) return m.id;
        }
    }

    return null;
}

import type { Measurement } from "../../types/measurement";
import { isCobb, isDistance } from "../../types/measurement";
import { DEFAULT_ANGLE_FONT_SIZE, DEFAULT_DISTANCE_FONT_SIZE } from "./constants";

export function getMeasurementLabelCenter(m: Measurement): { x: number; y: number } {
    if (isCobb(m)) {
        return {
            x: (m.upperLine.start.x + m.upperLine.end.x + m.lowerLine.start.x + m.lowerLine.end.x) / 4,
            y: (m.upperLine.start.y + m.upperLine.end.y + m.lowerLine.start.y + m.lowerLine.end.y) / 4,
        };
    }

    return {
        x: (m.line.start.x + m.line.end.x) / 2,
        y: (m.line.start.y + m.line.end.y) / 2,
    };
}

export function getMeasurementDefaultFontSize(m: Measurement): number {
    return isDistance(m) ? DEFAULT_DISTANCE_FONT_SIZE : DEFAULT_ANGLE_FONT_SIZE;
}

export function getMeasurementLabelFontSize(m: Measurement): number {
    return m.labelFontSize ?? getMeasurementDefaultFontSize(m);
}

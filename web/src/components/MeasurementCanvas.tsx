import { useCallback, useEffect, useRef, useState } from "react";
import { isDistance } from "../types/measurement";
import type { DistanceCalibration, Measurement, Point } from "../types/measurement";
import {
    DEFAULT_ANGLE_FONT_SIZE,
    DEFAULT_DISTANCE_FONT_SIZE,
} from "./measurement-canvas/constants";
import {
    findMeasurementLabelAtPosition,
    findMeasurementLineAtPosition,
    findPointAtPosition,
} from "./measurement-canvas/hitTesting";
import { renderMeasurementCanvas } from "./measurement-canvas/renderCanvas";
import { StyleEditorPanel } from "./measurement-canvas/StyleEditorPanel";

interface MeasurementCanvasProps {
    points: Point[];
    measurements: Measurement[];
    distanceCalibration: DistanceCalibration | null;
    activeTool: "none" | "angle" | "distance" | "pan";
    zoom: number;
    panX: number;
    panY: number;
    cursor: string;
    onAddPoint: (x: number, y: number) => void;
    onMovePoint: (pointId: string, x: number, y: number) => void;
    onStartDrag: (pointId: string) => void;
    onEndDrag: () => void;
    onMoveAngleLabel: (measurementId: string, x: number, y: number) => void;
    onStartAngleLabelDrag: (measurementId: string) => void;
    onEndAngleLabelDrag: () => void;
    onUpdateMeasurementStyle: (measurementId: string, lineColor: string, lineWidth: number) => void;
    onUpdateMeasurementLabelFontSize: (measurementId: string, fontSize: number) => void;
}

export function MeasurementCanvas({
    points,
    measurements,
    distanceCalibration,
    activeTool,
    zoom,
    panX,
    panY,
    cursor,
    onAddPoint,
    onMovePoint,
    onStartDrag,
    onEndDrag,
    onMoveAngleLabel,
    onStartAngleLabelDrag,
    onEndAngleLabelDrag,
    onUpdateMeasurementStyle,
    onUpdateMeasurementLabelFontSize,
}: MeasurementCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [draggedPoint, setDraggedPoint] = useState<string | null>(null);
    const [draggedLabelId, setDraggedLabelId] = useState<string | null>(null);
    const [resizedLabelId, setResizedLabelId] = useState<string | null>(null);
    const [resizeStartY, setResizeStartY] = useState<number | null>(null);
    const [resizeStartFontSize, setResizeStartFontSize] = useState<number | null>(null);

    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const [selectedMeasurementId, setSelectedMeasurementId] = useState<string | null>(null);
    const [stylePanelPosition, setStylePanelPosition] = useState<{ x: number; y: number } | null>(null);

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

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        renderMeasurementCanvas({
            canvas,
            containerWidth: containerSize.width,
            containerHeight: containerSize.height,
            points,
            measurements,
            distanceCalibration,
            zoom,
            panX,
            panY,
        });
    }, [containerSize.height, containerSize.width, distanceCalibration, measurements, panX, panY, points, zoom]);

    useEffect(() => {
        if (!selectedMeasurementId) return;
        const stillExists = measurements.some((m) => m.id === selectedMeasurementId);
        if (!stillExists) {
            setSelectedMeasurementId(null);
            setStylePanelPosition(null);
        }
    }, [measurements, selectedMeasurementId]);

    const getCanvasCoordinates = useCallback(
        (e: React.MouseEvent) => {
            if (!containerRef.current) return { x: 0, y: 0 };

            const rect = containerRef.current.getBoundingClientRect();
            const width = containerRef.current.clientWidth;
            const height = containerRef.current.clientHeight;
            const cx = e.clientX - rect.left;
            const cy = e.clientY - rect.top;

            return {
                x: (cx - panX - width / 2) / zoom + width / 2,
                y: (cy - panY - height / 2) / zoom + height / 2,
            };
        },
        [panX, panY, zoom]
    );

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (e.button !== 0) return;

            const { x, y } = getCanvasCoordinates(e);

            const pointId = findPointAtPosition(points, measurements, x, y, zoom);
            if (pointId) {
                e.stopPropagation();
                setDraggedPoint(pointId);
                onStartDrag(pointId);
                return;
            }

            const labelId = findMeasurementLabelAtPosition(measurements, x, y, zoom);
            if (labelId) {
                e.stopPropagation();
                setSelectedMeasurementId(null);
                setStylePanelPosition(null);
                setDraggedLabelId(labelId);

                if (e.shiftKey) {
                    const targetMeasurement = measurements.find((m) => m.id === labelId) ?? null;
                    const defaultFontSize = targetMeasurement && isDistance(targetMeasurement)
                        ? DEFAULT_DISTANCE_FONT_SIZE
                        : DEFAULT_ANGLE_FONT_SIZE;
                    const startFontSize = targetMeasurement?.labelFontSize ?? defaultFontSize;

                    setResizedLabelId(labelId);
                    setResizeStartY(y);
                    setResizeStartFontSize(startFontSize);
                } else {
                    setResizedLabelId(null);
                    setResizeStartY(null);
                    setResizeStartFontSize(null);
                }

                onStartAngleLabelDrag(labelId);
                return;
            }

            const measurementId = findMeasurementLineAtPosition(measurements, x, y, zoom);
            if (measurementId) {
                e.stopPropagation();
                const rect = containerRef.current?.getBoundingClientRect();
                const panelX = rect ? e.clientX - rect.left : 24;
                const panelY = rect ? e.clientY - rect.top : 24;
                setSelectedMeasurementId(measurementId);
                setStylePanelPosition({ x: panelX, y: panelY });
                return;
            }

            setSelectedMeasurementId(null);
            setStylePanelPosition(null);

            if (activeTool === "angle" && points.length < 4) {
                e.stopPropagation();
                onAddPoint(x, y);
            } else if (activeTool === "distance" && points.length < 2) {
                e.stopPropagation();
                onAddPoint(x, y);
            }
        },
        [
            activeTool,
            getCanvasCoordinates,
            measurements,
            onAddPoint,
            onStartAngleLabelDrag,
            onStartDrag,
            points,
            zoom,
        ]
    );

    const handleMouseMove = useCallback(
        (e: React.MouseEvent) => {
            const { x, y } = getCanvasCoordinates(e);

            if (draggedPoint) {
                onMovePoint(draggedPoint, x, y);
                return;
            }

            if (!draggedLabelId) return;

            if (
                resizedLabelId &&
                resizeStartY !== null &&
                resizeStartFontSize !== null &&
                resizedLabelId === draggedLabelId
            ) {
                const delta = resizeStartY - y;
                onUpdateMeasurementLabelFontSize(draggedLabelId, resizeStartFontSize + delta * 0.2);
                return;
            }

            onMoveAngleLabel(draggedLabelId, x, y);
        },
        [
            draggedLabelId,
            draggedPoint,
            getCanvasCoordinates,
            onMoveAngleLabel,
            onMovePoint,
            onUpdateMeasurementLabelFontSize,
            resizeStartFontSize,
            resizeStartY,
            resizedLabelId,
        ]
    );

    const handleMouseUp = useCallback(() => {
        if (draggedPoint) {
            setDraggedPoint(null);
            onEndDrag();
            return;
        }

        if (!draggedLabelId) return;

        setDraggedLabelId(null);
        setResizedLabelId(null);
        setResizeStartY(null);
        setResizeStartFontSize(null);
        onEndAngleLabelDrag();
    }, [draggedLabelId, draggedPoint, onEndAngleLabelDrag, onEndDrag]);

    const selectedMeasurement = selectedMeasurementId
        ? measurements.find((m) => m.id === selectedMeasurementId) ?? null
        : null;

    return (
        <div ref={containerRef} className="absolute inset-0" style={{ cursor }}>
            <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="w-full h-full"
            />

            {selectedMeasurement && stylePanelPosition && (
                <StyleEditorPanel
                    selectedMeasurement={selectedMeasurement}
                    stylePanelPosition={stylePanelPosition}
                    containerSize={containerSize}
                    onUpdateMeasurementStyle={onUpdateMeasurementStyle}
                    onUpdateMeasurementLabelFontSize={onUpdateMeasurementLabelFontSize}
                />
            )}

            {activeTool === "angle" && points.length < 4 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg border border-border bg-card/90 px-4 py-2 shadow-lg backdrop-blur-sm">
                    <p className="text-sm text-foreground">
                        {points.length === 0 && "Clique para marcar P1"}
                        {points.length === 1 && "Clique para marcar P2"}
                        {points.length === 2 && "Clique para marcar P3"}
                        {points.length === 3 && "Clique para marcar P4"}
                    </p>
                </div>
            )}

            {activeTool === "distance" && points.length < 2 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg border border-border bg-card/90 px-4 py-2 shadow-lg backdrop-blur-sm">
                    <p className="text-sm text-foreground">
                        {points.length === 0 && "Clique para marcar o ponto inicial"}
                        {points.length === 1 && "Clique para marcar o ponto final"}
                    </p>
                </div>
            )}
        </div>
    );
}

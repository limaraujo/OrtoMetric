import type { Measurement } from "../../types/measurement";
import { isDistance } from "../../types/measurement";
import { ANGLE_LABEL_COLOR, DEFAULT_ANGLE_FONT_SIZE, DEFAULT_DISTANCE_FONT_SIZE, LINE_WIDTH } from "./constants";

type Props = {
    selectedMeasurement: Measurement;
    stylePanelPosition: { x: number; y: number };
    containerSize: { width: number; height: number };
    onUpdateMeasurementStyle: (measurementId: string, lineColor: string, lineWidth: number) => void;
    onUpdateMeasurementLabelFontSize: (measurementId: string, fontSize: number) => void;
};

export function StyleEditorPanel({
    selectedMeasurement,
    stylePanelPosition,
    containerSize,
    onUpdateMeasurementStyle,
    onUpdateMeasurementLabelFontSize,
}: Props) {
    const selectedLineColor = selectedMeasurement.lineColor ?? ANGLE_LABEL_COLOR;
    const selectedLineWidth = selectedMeasurement.lineWidth ?? LINE_WIDTH;
    const selectedLabelFontSize = selectedMeasurement.labelFontSize
        ?? (isDistance(selectedMeasurement) ? DEFAULT_DISTANCE_FONT_SIZE : DEFAULT_ANGLE_FONT_SIZE);

    return (
        <div
            className="absolute z-20 rounded-lg border border-border bg-card/95 px-3 py-2 shadow-xl backdrop-blur-sm"
            style={{
                left: Math.min(stylePanelPosition.x + 12, Math.max(0, containerSize.width - 210)),
                top: Math.min(stylePanelPosition.y + 12, Math.max(0, containerSize.height - 170)),
                width: 198,
            }}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div className="mb-2 text-xs font-semibold text-foreground">Editar linha</div>
            <div className="mb-2 flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Cor</label>
                <input
                    type="color"
                    className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent p-0"
                    value={selectedLineColor}
                    onChange={(e) =>
                        onUpdateMeasurementStyle(selectedMeasurement.id, e.target.value, selectedLineWidth)
                    }
                />
            </div>
            <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Espessura</label>
                <input
                    type="range"
                    min={1}
                    max={12}
                    step={1}
                    className="h-2 w-full cursor-pointer"
                    value={selectedLineWidth}
                    onChange={(e) =>
                        onUpdateMeasurementStyle(selectedMeasurement.id, selectedLineColor, Number(e.target.value))
                    }
                />
                <span className="w-6 text-right text-xs text-foreground">{selectedLineWidth}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Numero</label>
                <input
                    type="range"
                    min={10}
                    max={64}
                    step={1}
                    className="h-2 w-full cursor-pointer"
                    value={selectedLabelFontSize}
                    onChange={(e) => onUpdateMeasurementLabelFontSize(selectedMeasurement.id, Number(e.target.value))}
                />
                <span className="w-7 text-right text-xs text-foreground">{selectedLabelFontSize}</span>
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">Dica: segure Shift e arraste o numero para aumentar/diminuir.</p>
        </div>
    );
}

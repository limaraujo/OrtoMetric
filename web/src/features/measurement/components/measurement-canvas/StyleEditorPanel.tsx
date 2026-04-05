import type { Measurement, PointAppearanceMode } from "../../types/measurement";
import { isDistance } from "../../types/measurement";
import {
  ANGLE_LABEL_COLOR,
  DEFAULT_ANGLE_FONT_SIZE,
  DEFAULT_DISTANCE_FONT_SIZE,
  LINE_WIDTH,
  POINT_BORDER,
  POINT_BORDER_COLOR,
  POINT_COLOR,
  POINT_FONT_SIZE,
  POINT_RADIUS,
} from "./constants";

type Props = {
  selectedMeasurement: Measurement;
  onUpdateMeasurementStyle: (measurementId: string, lineColor: string, lineWidth: number) => void;
  onUpdateMeasurementLabelFontSize: (measurementId: string, fontSize: number) => void;
  onUpdatePointStyle: (
    measurementId: string,
    pointColor: string,
    pointSize: number,
    pointBorderColor: string,
    pointBorderWidth: number,
    pointFontSize: number,
    pointAppearance: PointAppearanceMode,
    pointLabelVisible: boolean,
  ) => void;
};

export function StyleEditorPanel({
  selectedMeasurement,
  onUpdateMeasurementStyle,
  onUpdateMeasurementLabelFontSize,
  onUpdatePointStyle,
}: Props) {
  const selectedLineColor = selectedMeasurement.lineColor ?? ANGLE_LABEL_COLOR;
  const selectedLineWidth = selectedMeasurement.lineWidth ?? LINE_WIDTH;
  const selectedLabelFontSize = selectedMeasurement.labelFontSize
    ?? (isDistance(selectedMeasurement) ? DEFAULT_DISTANCE_FONT_SIZE : DEFAULT_ANGLE_FONT_SIZE);
  const selectedPointColor = selectedMeasurement.pointColor ?? POINT_COLOR;
  const selectedPointSize = selectedMeasurement.pointSize ?? POINT_RADIUS;
  const selectedPointBorderColor = selectedMeasurement.pointBorderColor ?? POINT_BORDER_COLOR;
  const selectedPointBorderWidth = selectedMeasurement.pointBorderWidth ?? POINT_BORDER;
  const selectedPointFontSize = selectedMeasurement.pointFontSize ?? POINT_FONT_SIZE;
  const selectedPointAppearance = selectedMeasurement.pointAppearance ?? "full";
  const selectedPointLabelVisible = selectedMeasurement.pointLabelVisible ?? true;

  return (
    <div
      className="absolute left-1/2 top-1/2 z-20 w-[min(92%,42rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card/95 px-3 py-2 shadow-xl backdrop-blur-sm"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex flex-row">
        {/*Linha*/}
        <div className="flex-1">
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
            <label className="text-xs text-muted-foreground">Font da Medição</label>
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
        </div>

        <div className='style-editor-panel-divider hidden sm:flex' />


        {/*Ponto*/}
        <div className="flex-[2]">
          <div className="mb-2 text-xs font-semibold text-foreground">Editar Ponto</div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex items-center gap-x-2">
              <label className="text-xs text-muted-foreground">Cor</label>
              <input
                type="color"
                className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent p-0"
                value={selectedPointColor}
                onChange={(e) =>
                  onUpdatePointStyle(
                    selectedMeasurement.id,
                    e.target.value,
                    selectedPointSize,
                    selectedPointBorderColor,
                    selectedPointBorderWidth,
                    selectedPointFontSize,
                    selectedPointAppearance,
                    selectedPointLabelVisible,
                  )
                }
              />
            </div>
            <div className="flex items-center gap-x-2">
              <label className="text-xs text-muted-foreground">Borda</label>
              <input
                type="color"
                className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent p-0"
                value={selectedPointBorderColor}
                onChange={(e) =>
                  onUpdatePointStyle(
                    selectedMeasurement.id,
                    selectedPointColor,
                    selectedPointSize,
                    e.target.value,
                    selectedPointBorderWidth,
                    selectedPointFontSize,
                    selectedPointAppearance,
                    selectedPointLabelVisible,
                  )
                }
              />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Tamanho</label>
            <input
              type="range"
              min={4}
              max={24}
              step={1}
              className="h-2 w-full cursor-pointer"
              value={selectedPointSize}
              onChange={(e) =>
                onUpdatePointStyle(
                  selectedMeasurement.id,
                  selectedPointColor,
                  Number(e.target.value),
                  selectedPointBorderColor,
                  selectedPointBorderWidth,
                  selectedPointFontSize,
                  selectedPointAppearance,
                  selectedPointLabelVisible,
                )
              }
            />
            <span className="w-7 text-right text-xs text-foreground">{selectedPointSize}</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Esp. borda</label>
            <input
              type="range"
              min={1}
              max={8}
              step={1}
              className="h-2 w-full cursor-pointer"
              value={selectedPointBorderWidth}
              onChange={(e) =>
                onUpdatePointStyle(
                  selectedMeasurement.id,
                  selectedPointColor,
                  selectedPointSize,
                  selectedPointBorderColor,
                  Number(e.target.value),
                  selectedPointFontSize,
                  selectedPointAppearance,
                  selectedPointLabelVisible,
                )
              }
            />
            <span className="w-7 text-right text-xs text-foreground">{selectedPointBorderWidth}</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Fonte ponto</label>
            <input
              type="range"
              min={8}
              max={28}
              step={1}
              className="h-2 w-full cursor-pointer"
              value={selectedPointFontSize}
              onChange={(e) =>
                onUpdatePointStyle(
                  selectedMeasurement.id,
                  selectedPointColor,
                  selectedPointSize,
                  selectedPointBorderColor,
                  selectedPointBorderWidth,
                  Number(e.target.value),
                  selectedPointAppearance,
                  selectedPointLabelVisible,
                )
              }
            />
            <span className="w-7 text-right text-xs text-foreground">{selectedPointFontSize}</span>
          </div>
        </div>

        <div className='style-editor-panel-divider hidden sm:flex' />

        {/*Geral*/}
        <div className="flex-[2]">
          <div className="mt-2 flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Aparência</label>
            <select
              className="clinical-input h-8 py-1 text-xs"
              value={selectedPointAppearance}
              onChange={(e) =>
                onUpdatePointStyle(
                  selectedMeasurement.id,
                  selectedPointColor,
                  selectedPointSize,
                  selectedPointBorderColor,
                  selectedPointBorderWidth,
                  selectedPointFontSize,
                  e.target.value as PointAppearanceMode,
                  selectedPointLabelVisible,
                )
              }
            >
              <option value="full">Completo</option>
              <option value="center">Só centro</option>
              <option value="hidden">Sem ponto</option>
            </select>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <label className="text-xs text-muted-foreground" htmlFor="point-label-visible">
              Mostrar fonte do ponto
            </label>
            <input
              id="point-label-visible"
              type="checkbox"
              checked={selectedPointLabelVisible}
              onChange={(e) =>
                onUpdatePointStyle(
                  selectedMeasurement.id,
                  selectedPointColor,
                  selectedPointSize,
                  selectedPointBorderColor,
                  selectedPointBorderWidth,
                  selectedPointFontSize,
                  selectedPointAppearance,
                  e.target.checked,
                )
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

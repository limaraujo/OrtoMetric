import type { Transform } from "./transform"
import type { Point, Measurement, DistanceCalibration } from "./measurement"

export type CanvasBoardProps = {
  image: string | null
  transform: Transform

  activeTool: "none" | "angle" | "distance" | "pan"
  isPanning: boolean
  isDragging: boolean
  isDraggingAngleLabel: boolean
  points: Point[]
  measurements: Measurement[]
  distanceCalibration: DistanceCalibration | null

  onAddPoint: (x: number, y: number) => void
  onMovePoint: (pointId: string, x: number, y: number) => void
  onStartDrag: (pointId: string) => void
  onEndDrag: () => void
  onMoveAngleLabel: (measurementId: string, x: number, y: number) => void
  onStartAngleLabelDrag: (measurementId: string) => void
  onEndAngleLabelDrag: () => void
  onUpdateMeasurementStyle: (measurementId: string, lineColor: string, lineWidth: number) => void
  onUpdateMeasurementLabelFontSize: (measurementId: string, fontSize: number) => void

  onLoadImage: (file: File) => void

  onStartPan: (e: React.MouseEvent) => void
  onUpdatePan: (e: React.MouseEvent) => void
  onEndPan: () => void
  onWheelZoom: (e: React.WheelEvent<HTMLDivElement>) => void
  onTouchStartZoom: (e: React.TouchEvent<HTMLDivElement>) => void
  onTouchMoveZoom: (e: React.TouchEvent<HTMLDivElement>) => void
  onTouchEndZoom: () => void
}
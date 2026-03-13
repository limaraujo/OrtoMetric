import type { Transform } from "../types/transform"
import type { Point, CobbMeasurement } from "../types/measurement"

export type CanvasBoardProps = {
  image: string | null
  transform: Transform

  activeTool: "none" | "cobb" | "pan"
  isPanning: boolean
  isDragging: boolean
  points: Point[]
  measurements: CobbMeasurement[]

  onAddPoint: (x: number, y: number) => void
  onMovePoint: (pointId: string, x: number, y: number) => void
  onStartDrag: (pointId: string) => void
  onEndDrag: () => void

  onLoadImage: (file: File) => void

  onStartPan: (e: React.MouseEvent) => void
  onUpdatePan: (e: React.MouseEvent) => void
  onEndPan: () => void
  onWheelZoom: (e: React.WheelEvent<HTMLDivElement>) => void
  onTouchStartZoom: (e: React.TouchEvent<HTMLDivElement>) => void
  onTouchMoveZoom: (e: React.TouchEvent<HTMLDivElement>) => void
  onTouchEndZoom: () => void
}
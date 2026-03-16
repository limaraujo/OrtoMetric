import { useCallback, useEffect, useRef, useState } from "react"
import { Upload, Image as ImageIcon } from "lucide-react"
import { ImageLoader } from "./ImageLoader"
import type { ImageLoaderHandle } from "./ImageLoader"
import { ImagePreview } from "./ui/ImagePreview"
import { MeasurementCanvas } from "./MeasurementCanvas"
import type { CanvasBoardProps } from "../types/canvas"

export function CanvasBoard({
  image,
  transform,
  activeTool,
  isPanning,
  isDragging,
  isDraggingAngleLabel,
  points,
  measurements,
  onAddPoint,
  onMovePoint,
  onStartDrag,
  onEndDrag,
  onMoveAngleLabel,
  onStartAngleLabelDrag,
  onEndAngleLabelDrag,
  onLoadImage,
  onStartPan,
  onUpdatePan,
  onEndPan,
  onWheelZoom,
  onTouchStartZoom,
  onTouchMoveZoom,
  onTouchEndZoom,
}: CanvasBoardProps) {

  const [isDropActive, setIsDropActive] = useState(false)

  const loaderRef = useRef<ImageLoaderHandle>(null)
  const interactionRef = useRef<HTMLDivElement>(null)

  const openLoader = () => loaderRef.current?.open()

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDropActive(false)

      const droppedFile = e.dataTransfer.files?.[0]

      if (droppedFile && droppedFile.type.startsWith("image/")) {
        onLoadImage(droppedFile)
      }
    },
    [onLoadImage],
  )

  /*
  ========================
  Prevent native scroll
  ========================
  */

  useEffect(() => {
    const element = interactionRef.current
    if (!element || !image) return

    const preventNative = (e: Event) => {
      e.preventDefault()
    }

    element.addEventListener("wheel", preventNative, { passive: false })
    element.addEventListener("touchmove", preventNative, { passive: false })

    return () => {
      element.removeEventListener("wheel", preventNative)
      element.removeEventListener("touchmove", preventNative)
    }
  }, [image])

  /*
  ========================
  Upload screen
  ========================
  */

  if (!image) {
    return (
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDropActive(true)
        }}
        onDragLeave={() => setIsDropActive(false)}
        onClick={openLoader}
        className={`
          flex flex-col items-center justify-center
          w-full h-full min-h-100 rounded-xl border-2 border-dashed
          transition-all duration-300 cursor-pointer
          ${isDropActive
            ? "border-primary bg-primary/10 scale-[1.02]"
            : "border-border bg-card/50 hover:border-primary/50 hover:bg-card"
          }
        `}
      >
        <div className="flex flex-col items-center gap-6 p-8 text-center text-muted-foreground">
          <div className={`p-6 rounded-full transition-all duration-300 ${isDropActive ? "bg-primary/20" : "bg-muted"}`}>
            <ImageIcon size={64} className={isDropActive ? "text-primary" : "text-muted-foreground"} />
          </div>

          <div className="space-y-2">
            <p className="text-xl font-semibold text-foreground">Enviar Radiografia</p>
            <p className="text-muted-foreground max-w-xs">
              Arraste e solte uma imagem aqui ou clique para selecionar
            </p>
            <p className="text-sm text-muted-foreground/70">Formatos aceitos: JPG, PNG</p>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation()
              openLoader()
            }}
            className="clinical-button clinical-button-primary cursor-pointer"
          >
            <Upload size={16} />
            Selecionar imagem
          </button>
        </div>

        <ImageLoader ref={loaderRef} onPick={onLoadImage} />
      </div>
    )
  }

  /*
  ========================
  Canvas area
  ========================
  */

  return (
    <div className="w-full h-full flex flex-col">
      <div
        ref={interactionRef}
        className="relative w-full flex-1 min-h-25 overflow-hidden rounded-xl border-2"

        onMouseDown={(e) => {
          if (isDragging) return

          // ferramenta pan com botão esquerdo
          if (activeTool === "pan" && e.button === 0) {
            onStartPan(e)
          }

          if(e.button === 0) {
            onStartPan(e)
          }

          // botão do meio sempre faz pan
          if (e.button === 1) {
            onStartPan(e)
          }
        }}

        onMouseMove={(e) => {
          if (isDragging) return
          onUpdatePan(e)
        }}

        onMouseUp={onEndPan}
        onMouseLeave={onEndPan}
        onWheel={onWheelZoom}
        onTouchStart={onTouchStartZoom}
        onTouchMove={onTouchMoveZoom}
        onTouchEnd={onTouchEndZoom}

        style={{
          cursor: isDragging
            ? "grabbing"
            : isPanning
            ? "grabbing"
            : activeTool === "pan"
            ? "grab"
            : "default",
          touchAction: "none",
          overscrollBehavior: "contain",
        }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate(${transform.panX}px, ${transform.panY}px) scale(${transform.zoom})`,
            transformOrigin: "center center",
            willChange: "transform",
            pointerEvents: "none",
          }}
        >
          <ImagePreview
            src={image}
            brightness={transform.brightness}
            contrast={transform.contrast}
            invert={transform.invert}
          />
        </div>

        <MeasurementCanvas
          points={points}
          measurements={measurements}
          activeTool={activeTool}
          zoom={transform.zoom}
          panX={transform.panX}
          panY={transform.panY}
          cursor={
            isDragging ? "grabbing"
            : isDraggingAngleLabel ? "grabbing"
            : isPanning ? "grabbing"
            : activeTool === "pan" ? "grab"
            : activeTool === "cobb" && points.length < 4 ? "crosshair"
            : "default"
          }
          onAddPoint={onAddPoint}
          onMovePoint={onMovePoint}
          onStartDrag={onStartDrag}
          onEndDrag={onEndDrag}
          onMoveAngleLabel={onMoveAngleLabel}
          onStartAngleLabelDrag={onStartAngleLabelDrag}
          onEndAngleLabelDrag={onEndAngleLabelDrag}
        />
      </div>

      <button
        onClick={openLoader}
        className="clinical-button clinical-button-primary cursor-pointer mt-2"
      >
        <Upload size={16} />
        Trocar imagem
      </button>

      <ImageLoader ref={loaderRef} onPick={onLoadImage} />
    </div>
  )
}
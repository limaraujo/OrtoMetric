import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { Toolbar } from '../components/Toolbar'
import { useMeasurement } from '../hooks/useMeasurement'
import { useImageCanvas } from '../hooks/useImageCanvas'
import { CanvasBoard } from '../components/CanvasBoard'
import { ResultsSidebar } from '../components/ResultsSidebar'
import api from '../../../lib/api'
import {
  loadAllMeasurementTypes,
  loadActiveMeasurementTypeId,
  saveActiveMeasurementTypeId,
  type MeasurementTypeItem,
} from '../../../lib/measurementTypes'

export default function InterfacePage() {
  const navigate = useNavigate()
  const [allTypes, setAllTypes] = useState<MeasurementTypeItem[]>([])
  const [selectedTypeId, setSelectedTypeId] = useState<string>('')
  const previousImageRef = useRef<string | null>(null)

  useEffect(() => {
    const loadTypes = async () => {
      const loaded = await loadAllMeasurementTypes()
      setAllTypes(loaded)
      const activeTypeId = await loadActiveMeasurementTypeId()
      const fallback = loaded[0]?.id ?? ''
      const resolved = loaded.some((t) => t.id === activeTypeId) ? (activeTypeId ?? fallback) : fallback
      setSelectedTypeId(resolved)
    }

    void loadTypes()
  }, [])

  useEffect(() => {
    if (!selectedTypeId) return
    void saveActiveMeasurementTypeId(selectedTypeId)
  }, [selectedTypeId])

  useEffect(() => {
    const verifySession = async () => {
      try {
        await api.get('/auth/me')
      } catch {
        navigate('/login')
      }
    }

    void verifySession()
  }, [navigate])

  const {
    state,
    addPoint,
    movePoint,
    startDrag,
    endDrag,
    setActiveTool,
    startAngleLabelDrag,
    endAngleLabelDrag,
    moveAngleLabel,
    updateMeasurementStyle,
    updateMeasurementLabelFontSize,
    removeMeasurement,
    clearAll,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useMeasurement()

  const selectedType: MeasurementTypeItem | null =
    allTypes.find((t) => t.id === selectedTypeId) ?? allTypes[0] ?? null

  const handleSelectType = (typeId: string) => {
    setSelectedTypeId(typeId)
    setActiveTool('none')
  }

  const {
    image,
    transform,
    isPanning,
    loadImage,
    zoomIn,
    zoomOut,
    resetZoom,
    setBrightness,
    setContrast,
    toggleInvert,
    startPan,
    updatePan,
    endPan,
    handleWheelZoom,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useImageCanvas(state.isDragging || !!state.draggedLabelId)

  // Clear canvas when image changes
  useEffect(() => {
    if (image && previousImageRef.current && previousImageRef.current !== image) {
      clearAll()
    }
    previousImageRef.current = image
  }, [image, clearAll])

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 flex gap-4 p-4 max-w-screen-2xl mx-auto w-full min-h-0">

        <div className="flex-1 flex flex-col gap-4">

          <Toolbar
            activeTool={state.activeTool}
            onSetTool={setActiveTool}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onResetZoom={resetZoom}
            brightness={transform.brightness}
            contrast={transform.contrast}
            onBrightnessChange={setBrightness}
            onContrastChange={setContrast}
            onToggleInvert={toggleInvert}
            isInverted={transform.invert}
            onUndo={undo}
            onRedo={redo}
            onClear={clearAll}
            onOpenCalibrationPanel={() => { }}
            canUndo={canUndo}
            canRedo={canRedo}
            types={allTypes}
            selectedTypeId={selectedType?.id ?? ''}
            onSelectType={handleSelectType}
          />

          <CanvasBoard
            image={image}
            transform={transform}
            activeTool={state.activeTool}
            isPanning={isPanning}
            isDragging={state.isDragging}
            isDraggingAngleLabel={!!state.draggedLabelId}
            points={state.points}
            measurements={state.measurements}
            distanceCalibration={null}
            onAddPoint={(x, y) => addPoint(x, y, selectedType?.id)}
            onMovePoint={movePoint}
            onStartDrag={startDrag}
            onEndDrag={endDrag}
            onMoveAngleLabel={moveAngleLabel}
            onStartAngleLabelDrag={startAngleLabelDrag}
            onEndAngleLabelDrag={endAngleLabelDrag}
            onUpdateMeasurementStyle={updateMeasurementStyle}
            onUpdateMeasurementLabelFontSize={updateMeasurementLabelFontSize}
            onLoadImage={loadImage}
            onStartPan={startPan}
            onUpdatePan={updatePan}
            onEndPan={endPan}
            onWheelZoom={handleWheelZoom}
            onTouchStartZoom={handleTouchStart}
            onTouchMoveZoom={handleTouchMove}
            onTouchEndZoom={handleTouchEnd}
          />

        </div>

        <ResultsSidebar
          measurements={state.measurements}
          types={allTypes}
          distanceCalibration={null}
          onDeleteMeasurement={removeMeasurement}
        />

      </main>

      <footer className="h-12 border-t border-border bg-card/50 flex items-center justify-center">
        <p className="text-xs text-muted-foreground">
          Radiology Measure © {new Date().getFullYear()} — Ferramenta de medições radiológicas
        </p>
      </footer>
    </div>
  )
}
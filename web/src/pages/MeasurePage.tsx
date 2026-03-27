import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { Toolbar } from '../components/Toolbar'
import { useMeasurement } from '../hooks/useMeasurement'
import { useImageCanvas } from '../hooks/useImageCanvas'
import { CanvasBoard } from '../components/CanvasBoard'
import { ResultsSidebar } from '../components/ResultsSidebar'
import api from '../lib/api'

export default function App() {
  const navigate = useNavigate()

  useEffect(() => {
    const token = sessionStorage.getItem("access_token")
    if (!token) {
      navigate("/login")
      return
    }

    const verifySession = async () => {
      try {
        await api.get('/auth/me')
      } catch {
        sessionStorage.removeItem('access_token')
        sessionStorage.removeItem('user')
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
    clearAll,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useMeasurement()

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
  } = useImageCanvas(state.isDragging || !!state.draggedAngleLabelId)

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
            canUndo={canUndo}
            canRedo={canRedo}
          />

          <CanvasBoard
            image={image}
            transform={transform}
            activeTool={state.activeTool}
            isPanning={isPanning}
            isDragging={state.isDragging}
            isDraggingAngleLabel={!!state.draggedAngleLabelId}
            points={state.points}
            measurements={state.measurements}
            onAddPoint={addPoint}
            onMovePoint={movePoint}
            onStartDrag={startDrag}
            onEndDrag={endDrag}
            onMoveAngleLabel={moveAngleLabel}
            onStartAngleLabelDrag={startAngleLabelDrag}
            onEndAngleLabelDrag={endAngleLabelDrag}
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
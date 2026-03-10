import './App.css'
import { Header } from './components/Header'
import { Toolbar } from './components/Toolbar'
import { useMeasurement } from './hooks/useMeasurement'
import { useImageCanvas } from './hooks/useImageCanvas'
import { CanvasBoard } from './components/CanvasBoard'
import { ResultsSidebar } from './components/ResultsSidebar'
import { MeasurementCanvas } from './components/MeasurementCanvas'

export default function App() {
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
    handleWheel,
  } = useImageCanvas();

  const {
    state,
    addPoint,
    movePoint,
    startDrag,
    endDrag,
    setActiveTool,
    clearAll,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useMeasurement();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      {/* Main */}
      <main className="flex-1 flex flex-row lg:flex-row gap-4 p-4 max-w-screen-2xl mx-auto w-full">
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

          {/* Image Canvas */}

          <CanvasBoard />
        </div>

        <ResultsSidebar />

      </main>

      {/* Footer */}
      <footer className="h-12 border-t border-border bg-card/50 flex items-center justify-center">
        <p className="text-xs text-muted-foreground">
          Radiology Measure © {new Date().getFullYear()} — Ferramenta de medições radiológicas
        </p>
      </footer>
    </div >

  );
}




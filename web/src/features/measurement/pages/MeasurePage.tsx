import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { Toolbar } from '../components/Toolbar'
import { useMeasurement } from '../hooks/useMeasurement'
import { useImageCanvas } from '../hooks/useImageCanvas'
import { CanvasBoard } from '../components/CanvasBoard'
import type { CanvasBoardHandle } from '../components/CanvasBoard'
import { ResultsSidebar } from '../components/ResultsSidebar'
import api, { clearAccessToken } from '../../../lib/api'
import {
  loadAllMeasurementTypes,
  loadActiveMeasurementTypeId,
  saveActiveMeasurementTypeId,
  type MeasurementTypeItem,
} from '../../../lib/measurementTypes'
import type { DistanceCalibration } from '../types/measurement'
import { isDistance } from '../types/measurement'

const DISTANCE_CALIBRATION_STORAGE_KEY = 'ortometric_distance_calibration'

const readDistanceCalibration = (): DistanceCalibration | null => {
  if (typeof window === 'undefined') return null

  const rawCalibration = window.sessionStorage.getItem(DISTANCE_CALIBRATION_STORAGE_KEY)
  if (!rawCalibration) return null

  try {
    const parsed = JSON.parse(rawCalibration) as Partial<DistanceCalibration>
    const pixelsPerUnit = Number(parsed.pixelsPerUnit)
    const unit = typeof parsed.unit === 'string' ? parsed.unit.trim() : ''

    if (!Number.isFinite(pixelsPerUnit) || pixelsPerUnit <= 0 || !unit) {
      return null
    }

    return { pixelsPerUnit, unit }
  } catch {
    return null
  }
}

export default function MeasurePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [allTypes, setAllTypes] = useState<MeasurementTypeItem[]>([])
  const [selectedTypeId, setSelectedTypeId] = useState<string>('')
  const [typesError, setTypesError] = useState('')
  const [distanceCalibration, setDistanceCalibration] = useState<DistanceCalibration | null>(() => readDistanceCalibration())
  const [isCalibrationPanelOpen, setIsCalibrationPanelOpen] = useState(false)
  const [calibrationReferenceId, setCalibrationReferenceId] = useState('')
  const [calibrationRealDistance, setCalibrationRealDistance] = useState('')
  const [calibrationUnit, setCalibrationUnit] = useState('mm')
  const previousImageRef = useRef<string | null>(null)
  const canvasBoardRef = useRef<CanvasBoardHandle>(null)

  useEffect(() => {
    const loadTypes = async () => {
      try {
        setTypesError('')
        const loaded = await loadAllMeasurementTypes()
        setAllTypes(loaded)
        const queryType = searchParams.get('type')
        const activeTypeId = await loadActiveMeasurementTypeId()
        const initialType = queryType ?? activeTypeId ?? loaded[0]?.id ?? ''
        const resolved = loaded.some((t) => t.id === initialType)
          ? initialType
          : (loaded[0]?.id ?? '')
        setSelectedTypeId(resolved)
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 401) {
          clearAccessToken()
          navigate('/login')
          return
        }
        setTypesError('Falha ao carregar tipos de medição do servidor.')
      }
    }

    void loadTypes()
  }, [navigate, searchParams])

  useEffect(() => {
    const queryType = searchParams.get('type')
    if (!queryType) return

    if (allTypes.some((t) => t.id === queryType)) {
      setSelectedTypeId(queryType)
    }
  }, [searchParams, allTypes])

  useEffect(() => {
    if (!selectedTypeId) return

    const persistSelection = async () => {
      try {
        await saveActiveMeasurementTypeId(selectedTypeId)
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 401) {
          clearAccessToken()
          navigate('/login')
          return
        }
        setTypesError('Falha ao salvar tipo ativo no servidor.')
      }
    }

    void persistSelection()
  }, [navigate, selectedTypeId])

  useEffect(() => {
    const verifySession = async () => {
      try {
        await api.get('/auth/me')
      } catch {
        clearAccessToken()
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
    updatePointStyle,
    removeMeasurement,
    clearAll,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useMeasurement()

  const selectedType: MeasurementTypeItem | null =
    allTypes.find((t) => t.id === selectedTypeId) ?? allTypes[0] ?? null
  const preferredDistanceUnit = selectedType?.baseType === 'distancia'
    ? selectedType.unitMeasure
    : 'mm'
  const distanceMeasurements = useMemo(
    () => state.measurements.filter(isDistance),
    [state.measurements],
  )

  const handleSelectType = (typeId: string) => {
    setSelectedTypeId(typeId)
    setActiveTool('none')
  }

  const handleClearDistanceCalibration = () => {
    setDistanceCalibration(null)
  }

  useEffect(() => {
    if (!isCalibrationPanelOpen) return

    if (distanceMeasurements.length === 0) {
      setCalibrationReferenceId('')
      return
    }

    const stillExists = distanceMeasurements.some((measurement) => measurement.id === calibrationReferenceId)
    if (!calibrationReferenceId || !stillExists) {
      setCalibrationReferenceId(distanceMeasurements[distanceMeasurements.length - 1].id)
    }
  }, [calibrationReferenceId, distanceMeasurements, isCalibrationPanelOpen])

  useEffect(() => {
    if (distanceCalibration?.unit) {
      setCalibrationUnit(distanceCalibration.unit)
      return
    }

    setCalibrationUnit(preferredDistanceUnit || 'mm')
  }, [distanceCalibration?.unit, preferredDistanceUnit])

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (distanceCalibration) {
      window.sessionStorage.setItem(
        DISTANCE_CALIBRATION_STORAGE_KEY,
        JSON.stringify(distanceCalibration),
      )
      return
    }

    window.sessionStorage.removeItem(DISTANCE_CALIBRATION_STORAGE_KEY)
  }, [distanceCalibration])

  const handleApplyCalibration = () => {
    const parsedRealDistance = Number(calibrationRealDistance)
    if (!calibrationReferenceId || !Number.isFinite(parsedRealDistance) || parsedRealDistance <= 0) {
      return
    }

    const referenceMeasurement = state.measurements.find((measurement) => measurement.id === calibrationReferenceId)
    if (!referenceMeasurement || !isDistance(referenceMeasurement)) {
      return
    }

    setDistanceCalibration({
      pixelsPerUnit: referenceMeasurement.distance / parsedRealDistance,
      unit: calibrationUnit.trim() || preferredDistanceUnit,
    })
  }

  const handleOpenCalibrationPanel = () => {
    setIsCalibrationPanelOpen((current) => !current)
  }

  const handleCloseCalibrationPanel = () => {
    setIsCalibrationPanelOpen(false)
  }

  const handleClearAll = () => {
    clearAll()
    setDistanceCalibration(null)
    setCalibrationRealDistance('')
    setIsCalibrationPanelOpen(false)
  }

  const requestAnnotatedImage = async () => canvasBoardRef.current?.captureAnnotatedImage() ?? null

  const {
    image,
    imageName,
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
      setDistanceCalibration(null)
    }
    previousImageRef.current = image
  }, [image, clearAll])

  return (
    <div className="h-full flex flex-col bg-background">

      <main className="flex-1 flex gap-4 p-4 max-w-screen-2xl mx-auto w-full min-h-0 overflow-hidden">

        <div className="flex-1 flex flex-col gap-4 min-h-0">

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
            onClear={handleClearAll}
            onOpenCalibrationPanel={handleOpenCalibrationPanel}
            canUndo={canUndo}
            canRedo={canRedo}
            types={allTypes}
            selectedTypeId={selectedType?.id ?? ''}
            onSelectType={handleSelectType}
          />

          {isCalibrationPanelOpen && (
            <div className="rounded-xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Calibração de distância</h3>
                  <p className="text-xs text-muted-foreground">
                    Use uma distância conhecida da imagem para converter pixels em unidade real.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseCalibrationPanel}
                  className="clinical-button clinical-button-ghost px-3 py-1 text-xs"
                >
                  Fechar
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_0.8fr]">
                <label className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Medição de referência</span>
                  <select
                    value={calibrationReferenceId}
                    onChange={(e) => setCalibrationReferenceId(e.target.value)}
                    className="clinical-input h-9 py-1.5 text-sm w-full"
                    disabled={distanceMeasurements.length === 0}
                  >
                    {distanceMeasurements.length === 0 ? (
                      <option value="">Crie uma distância primeiro</option>
                    ) : (
                      distanceMeasurements.map((measurement, index) => (
                        <option key={measurement.id} value={measurement.id}>
                          Distância #{index + 1} ({measurement.distance.toFixed(1)} px)
                        </option>
                      ))
                    )}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Distância real</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.1"
                    value={calibrationRealDistance}
                    onChange={(e) => setCalibrationRealDistance(e.target.value)}
                    placeholder="Ex.: 25"
                    className="clinical-input h-9 py-1.5 text-sm w-full"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Unidade</span>
                  <input
                    type="text"
                    value={calibrationUnit}
                    onChange={(e) => setCalibrationUnit(e.target.value)}
                    placeholder="mm"
                    className="clinical-input h-9 py-1.5 text-sm w-full"
                  />
                </label>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleApplyCalibration}
                  disabled={distanceMeasurements.length === 0}
                  className="clinical-button clinical-button-primary"
                >
                  Aplicar escala
                </button>
                <button
                  type="button"
                  onClick={handleClearDistanceCalibration}
                  className="clinical-button clinical-button-ghost"
                >
                  Limpar escala
                </button>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                {distanceCalibration
                  ? `Escala ativa: 1 ${distanceCalibration.unit} = ${distanceCalibration.pixelsPerUnit.toFixed(3)} px`
                  : 'Sem escala ativa. Distâncias continuam em pixels.'}
              </p>
            </div>
          )}

          <CanvasBoard
            ref={canvasBoardRef}
            image={image}
            transform={transform}
            activeTool={state.activeTool}
            isPanning={isPanning}
            isDragging={state.isDragging}
            isDraggingAngleLabel={!!state.draggedLabelId}
            points={state.points}
            measurements={state.measurements}
            distanceCalibration={distanceCalibration}
            onAddPoint={(x, y) => addPoint(x, y, selectedType?.id)}
            onMovePoint={movePoint}
            onStartDrag={startDrag}
            onEndDrag={endDrag}
            onMoveAngleLabel={moveAngleLabel}
            onStartAngleLabelDrag={startAngleLabelDrag}
            onEndAngleLabelDrag={endAngleLabelDrag}
            onUpdateMeasurementStyle={updateMeasurementStyle}
            onUpdateMeasurementLabelFontSize={updateMeasurementLabelFontSize}
            onUpdatePointStyle={updatePointStyle}
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
          imageName={imageName}
          imageDataUrl={image}
          onRequestAnnotatedImage={requestAnnotatedImage}
          measurements={state.measurements}
          types={allTypes}
          distanceCalibration={distanceCalibration}
          onDeleteMeasurement={removeMeasurement}
        />

      </main>

      {typesError && (
        <div
          className="fixed bottom-16 left-1/2 z-20 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-lg border border-destructive/35 bg-destructive/15 px-4 py-2 text-sm text-red-200"
          role="alert"
          aria-live="assertive"
        >
          {typesError}
        </div>
      )}
    </div>
  )
}
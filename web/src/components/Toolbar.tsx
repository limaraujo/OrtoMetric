import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  Ruler,
  Scale,
  Undo2,
  Redo2,
  Trash2,
  Sun,
  Contrast,
  FlipHorizontal2,
} from 'lucide-react';

import { Slider } from './ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import type { MeasurementTypeItem } from '../lib/measurementTypes';

interface ToolbarProps {
  activeTool: 'none' | 'angle' | 'distance' | 'pan';
  onSetTool: (tool: 'none' | 'angle' | 'distance' | 'pan') => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  brightness: number;
  contrast: number;
  onBrightnessChange: (value: number) => void;
  onContrastChange: (value: number) => void;
  onToggleInvert: () => void;
  isInverted: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onOpenCalibrationPanel: () => void;
  canUndo: boolean;
  canRedo: boolean;
  types: MeasurementTypeItem[];
  selectedTypeId: string;
  onSelectType: (typeId: string) => void;
}


export function Toolbar({
  activeTool,
  onSetTool,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  brightness,
  contrast,
  onBrightnessChange,
  onContrastChange,
  onToggleInvert,
  isInverted,
  onUndo,
  onRedo,
  onClear,
  onOpenCalibrationPanel,
  canUndo,
  canRedo,
  types,
  selectedTypeId,
  onSelectType,
}: ToolbarProps) {
  return (
    <TooltipProvider>
      <div className="clinical-card flex items-center gap-3 !rounded-xl !bg-card/90 !p-2">

        <label className="hidden sm:flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Tipo</span>
          <select
            value={selectedTypeId}
            onChange={(e) => onSelectType(e.target.value)}
            className="clinical-input h-9 py-1.5 text-sm min-w-42"
            disabled={types.length === 0}
          >
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>

        <div className='toolbar-divider hidden sm:flex' />

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => {
                const selectedType = types.find((type) => type.id === selectedTypeId)
                if (!selectedType) return

                onSetTool(selectedType.baseType === 'distancia' ? 'distance' : 'angle')
              }}
              className={`clinical-button-icon ${activeTool === 'angle' || activeTool === 'distance' ? 'bg-primary text-primary-foreground' : ''}`}
              disabled={types.length === 0}
            >
              <Ruler className="w-5 h-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Iniciar medição</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onSetTool('pan')}
              className={`clinical-button-icon ${activeTool === 'pan' ? 'bg-primary text-primary-foreground' : ''}`}
            >
              <Move className='w-5 h-5' />
            </button>
          </TooltipTrigger>
          <TooltipContent>Mover imagem</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onOpenCalibrationPanel}
              className="clinical-button-icon"
            >
              <Scale className="w-5 h-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Calibrar distância</TooltipContent>
        </Tooltip>

        <div className='toolbar-divider' />

        {/*Zoom, Rotate, Flip*/}
        <div className="flex items-center gap-1">

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onZoomIn} className='clinical-button-icon'>
                <ZoomIn className='w-5 h-5' />
              </button>
            </TooltipTrigger>
            <TooltipContent>Zoom in</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onZoomOut} className='clinical-button-icon'>
                <ZoomOut className='w-5 h-5' />
              </button>
            </TooltipTrigger>
            <TooltipContent>Zoom out</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onResetZoom} className='clinical-button-icon'>
                <RotateCcw className='w-5 h-5' />
              </button>
            </TooltipTrigger>
            <TooltipContent>Resetar zoom</TooltipContent>
          </Tooltip>
        </div>

        <div className='toolbar-divider' />

        {/*Image adjustments*/}

        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-muted-foreground" />
            <Slider
              value={[brightness]}
              onValueChange={([v]) => onBrightnessChange(v)}
              min={0}
              max={200}
              step={5}
              className="w-24"
            />
          </div>

          <div className="flex items-center gap-2">
            <Contrast className="w-5 h-5 text-muted-foreground" />
            <Slider
              value={[contrast]}
              onValueChange={([v]) => onContrastChange(v)}
              min={0}
              max={200}
              step={5}
              className="w-24"
            />
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleInvert}
                className={`clinical-button-icon ${isInverted ? 'bg-primary text-primary-foreground' : ''}`}
              >
                <FlipHorizontal2 className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Inverter imagem</TooltipContent>
          </Tooltip>
        </div>

        <div className='hidden md:flex items-center gap-4 toolbar-divider' />

        {/*Undo, Redo, Clear*/}

        <div className="flex items-center gap-1">

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className="clinical-button-icon"
              >
                <Undo2 className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Desfazer</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                className="clinical-button-icon"
              >
                <Redo2 className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Refazer</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onClear}
                className="clinical-button-icon"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Limpar medições</TooltipContent>
          </Tooltip>
        </div>

      </div>
    </TooltipProvider>
  );
};

export default Toolbar;
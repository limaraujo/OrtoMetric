import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  Ruler,
  Undo2,
  Redo2,
  Trash2,
  Sun,
  Contrast,
  FlipHorizontal2,
} from 'lucide-react';

import { Slider } from './ui/slider';

interface ToolbarProps {
  activeTool: 'none' | 'cobb' | 'pan';
  onSetTool: (tool: 'none' | 'cobb' | 'pan') => void;
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
  canUndo: boolean;
  canRedo: boolean;
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
  canUndo,
  canRedo,
}: ToolbarProps) {
  return (
    <div className="clinical-card flex items-center gap-3 !rounded-xl !bg-card/90 !p-2">

      <div className="flex items-center gap-2">
        <button
          onClick={() => onSetTool('cobb')}
          className={`clinical-button-icon ${activeTool === 'cobb' ? 'bg-primary text-primary-foreground' : ''}`}
        >
          <Ruler className="w-5 h-5" />
        </button>

        <button
          onClick={() => onSetTool('pan')}
          className={`clinical-button-icon ${activeTool === 'pan' ? 'bg-primary text-primary-foreground' : ''}`}
        >
          <Move className='w-5 h-5' />
        </button>
      </div>

      <div className='toolbar-divider' />

      {/*Zoom, Rotate, Flip*/}
      <div className="flex items-center gap-1">

        <button
          onClick={onZoomIn} className='clinical-button-icon'>
          <ZoomIn className='w-5 h-5' />
        </button>

        <button
          onClick={onZoomOut} className='clinical-button-icon'>
          <ZoomOut className='w-5 h-5' />
        </button>

        <button
          onClick={onResetZoom} className='clinical-button-icon'>
          <RotateCcw className='w-5 h-5' />
        </button>
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

        <button
          onClick={onToggleInvert}
          className={`clinical-button-icon ${isInverted ? 'bg-primary text-primary-foreground' : ''}`}
        >
          <FlipHorizontal2 className="w-5 h-5" />
        </button>
      </div>

      <div className='hidden md:flex items-center gap-4 toolbar-divider' />

      {/*Undo, Redo, Clear*/}

      <div className="flex items-center gap-1">

        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="clinical-button-icon"
        >
          <Undo2 className="w-5 h-5" />
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="clinical-button-icon"
        >
          <Redo2 className="w-5 h-5" />
        </button>

        <button
          onClick={onClear}
          className="clinical-button-icon"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
};

export default Toolbar;
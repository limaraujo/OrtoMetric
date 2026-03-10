import { useState } from 'react';


export function useImageCanvas() {
  const [image, setImage] = useState<string | null>(null);
  const [transform, setTransform] = useState({
    zoom: 1,
    panX: 0,
    panY: 0,
    brightness: 100,
    contrast: 100,
    invert: false,
  });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const loadImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const zoomIn = () =>
    setTransform((prev) => ({ ...prev, zoom: Math.min(prev.zoom + 0.2, 5) }));

  const zoomOut = () =>
    setTransform((prev) => ({ ...prev, zoom: Math.max(prev.zoom - 0.2, 0.5) }));

  const resetZoom = () =>
    setTransform((prev) => ({ ...prev, zoom: 1, panX: 0, panY: 0 }));

  const setBrightness = (value: number) =>
    setTransform((prev) => ({ ...prev, brightness: value }));

  const setContrast = (value: number) =>
    setTransform((prev) => ({ ...prev, contrast: value }));

  const toggleInvert = () =>
    setTransform((prev) => ({ ...prev, invert: !prev.invert }));

  const startPan = (e: React.MouseEvent) => {
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
  };

  const updatePan = (e: React.MouseEvent) => {
    if (!isPanning) return;
    const deltaX = e.clientX - panStart.x;
    const deltaY = e.clientY - panStart.y;
    setTransform((prev) => ({
      ...prev,
      panX: prev.panX + deltaX,
      panY: prev.panY + deltaY,
    }));
    setPanStart({ x: e.clientX, y: e.clientY });
  };

  const endPan = () => setIsPanning(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.deltaY > 0 ? zoomOut() : zoomIn();
  };

  return {
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
  };
}

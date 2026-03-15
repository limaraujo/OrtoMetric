import { useRef, useState } from "react";

export function useImageCanvas(isDragging: boolean) {
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 5;
  const ZOOM_STEP = 0.2;

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

  const [panStart, setPanStart] = useState({
    x: 0,
    y: 0,
  });

  const pinchStartRef = useRef<{
    distance: number;
    zoom: number;
    centerX: number;
    centerY: number;
  } | null>(null);

  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

  /*
  ========================
  Zoom anchored
  ========================
  */

  const zoomAt = (
    nextZoom: number,
    centerX: number,
    centerY: number,
    rect: DOMRect
  ) => {
    setTransform((prev) => {
      const currentZoom = prev.zoom;
      const clampedZoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);

      if (clampedZoom === currentZoom) return prev;

      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const localX = centerX - rect.left;
      const localY = centerY - rect.top;

      return {
        ...prev,
        zoom: clampedZoom,
        panX: prev.panX + (localX - cx) * (currentZoom - clampedZoom),
        panY: prev.panY + (localY - cy) * (currentZoom - clampedZoom),
      };
    });
  };

  /*
  ========================
  Image loading
  ========================
  */

  const loadImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  /*
  ========================
  Zoom controls
  ========================
  */

  const zoomIn = () =>
    setTransform((prev) => ({
      ...prev,
      zoom: clamp(prev.zoom + ZOOM_STEP, MIN_ZOOM, MAX_ZOOM),
    }));

  const zoomOut = () =>
    setTransform((prev) => ({
      ...prev,
      zoom: clamp(prev.zoom - ZOOM_STEP, MIN_ZOOM, MAX_ZOOM),
    }));

  const resetZoom = () =>
    setTransform((prev) => ({
      ...prev,
      zoom: 1,
      panX: 0,
      panY: 0,
    }));

  /*
  ========================
  Image adjustments
  ========================
  */

  const setBrightness = (value: number) =>
    setTransform((prev) => ({
      ...prev,
      brightness: value,
    }));

  const setContrast = (value: number) =>
    setTransform((prev) => ({
      ...prev,
      contrast: value,
    }));

  const toggleInvert = () =>
    setTransform((prev) => ({
      ...prev,
      invert: !prev.invert,
    }));

  /*
  ========================
  PAN
  ========================
  */

  const startPan = (e: React.MouseEvent) => {
    if (isDragging) return;

    setIsPanning(true);

    setPanStart({
      x: e.clientX,
      y: e.clientY,
    });
  };

  const updatePan = (e: React.MouseEvent) => {
    if (!isPanning || isDragging) return;

    const deltaX = e.clientX - panStart.x;
    const deltaY = e.clientY - panStart.y;

    setTransform((prev) => ({
      ...prev,
      panX: prev.panX + deltaX / prev.zoom,
      panY: prev.panY + deltaY / prev.zoom,
    }));

    setPanStart({
      x: e.clientX,
      y: e.clientY,
    });
  };

  const endPan = () => {
    setIsPanning(false);
  };

  /*
  ========================
  Wheel zoom
  ========================
  */

  const handleWheelZoom = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!image) return;

    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();

    const isPinch = e.ctrlKey;

    let factor = 1;

    if (isPinch) {
      factor = e.deltaY < 0 ? 1.10 : 0.90;
    } else {
      factor = e.deltaY < 0 ? 1.1 : 0.9;
    }

    zoomAt(transform.zoom * factor, e.clientX, e.clientY, rect);
  };

  /*
  ========================
  Touch zoom
  ========================
  */

  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;

    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;

    return Math.hypot(dx, dy);
  };

  const getTouchCenter = (touches: React.TouchList) => ({
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  });

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!image) return;

    e.preventDefault();

    if (e.touches.length === 2) {
      const center = getTouchCenter(e.touches);
      pinchStartRef.current = {
        distance: getTouchDistance(e.touches),
        zoom: transform.zoom,
        centerX: center.x,
        centerY: center.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!image) return;

    e.preventDefault();

    if (e.touches.length !== 2 || !pinchStartRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();

    const currentDistance = getTouchDistance(e.touches);

    if (!currentDistance || !pinchStartRef.current.distance) return;

    const scaleFactor = currentDistance / pinchStartRef.current.distance;

    zoomAt(
      pinchStartRef.current.zoom * scaleFactor,
      pinchStartRef.current.centerX,
      pinchStartRef.current.centerY,
      rect
    );
  };

  const handleTouchEnd = () => {
    pinchStartRef.current = null;
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

    handleWheelZoom,

    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
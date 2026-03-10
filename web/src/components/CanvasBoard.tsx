import { useRef, useState, useCallback } from "react";
import { ImageLoader } from "./ImageLoader";
import type { ImageLoaderHandle } from "./ImageLoader";
import { ImagePreview } from "./ui/ImagePreview";
import { useObjectURL } from "../hooks/useObjectURL";
import { Upload, Image as ImageIcon } from "lucide-react";




export function CanvasBoard() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const imageUrl = useObjectURL(file);

  const loaderRef = useRef<ImageLoaderHandle>(null);

  const openLoader = () => loaderRef.current?.open();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];

    if (droppedFile && droppedFile.type.startsWith("image/")) {
      setFile(droppedFile);
    }
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="w-full h-full">
      {imageUrl ? (
        <>
          <div className="flex items-center justify-center w-full h-full min-h-[100px] rounded-xl border-2 transition-all duration-300 cursor-pointer">
            <ImagePreview src={imageUrl} />
          </div>
          <button
            onClick={openLoader}
            className="clinical-button clinical-button-primary cursor-pointer"
          >
            <Upload size={16} />
            Trocar imagem
          </button>
        </>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={openLoader}
          className={`
            flex flex-col items-center justify-center
            w-full h-full min-h-100 rounded-xl border-2 border-dashed
            transition-all duration-300 cursor-pointer
            ${isDragging
              ? "border-primary bg-primary/10 scale-[1.02]"
              : "border-border bg-card/50 hover:border-primary/50 hover:bg-card"
            }
          `}
        >
          <div className="flex flex-col items-center gap-6 p-8 text-center text-muted-foreground">
            <div className={`p-6 rounded-full transition-all duration-300 ${isDragging ? "bg-primary/20" : "bg-muted"}`}>
              <ImageIcon size={64} className={isDragging ? "text-primary" : "text-muted-foreground"} />
            </div>

            <div className="space-y-2">
              <p className="text-xl font-semibold text-foreground">Enviar Radiografia</p>
              <p className="text-muted-foreground max-w-xs">Arraste e solte uma imagem aqui ou clique para selecionar</p>
              <p className="text-sm text-muted-foreground/70">Formatos aceitos: JPG, PNG</p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                openLoader();
              }}
              className="clinical-button clinical-button-primary cursor-pointer"
            >
              <Upload size={16} />
              Selecionar imagem
            </button>
          </div>
        </div>
      )}

      <ImageLoader ref={loaderRef} onPick={setFile} />
    </div>
  );
}
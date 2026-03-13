type Props = {
  src: string
  brightness: number
  contrast: number
  invert: boolean
}

export function ImagePreview({ src, brightness, contrast, invert }: Props) {
  return (
    <img
      src={src}
      alt="Imagem carregada"
      style={{
        display: "block",
        maxHeight: "70vh",
        objectFit: "contain",
        filter: `brightness(${brightness}%) contrast(${contrast}%)${
          invert ? " invert(100%)" : ""
        }`,
        userSelect: "none",
        pointerEvents: "none",
      }}
    />
  )
}
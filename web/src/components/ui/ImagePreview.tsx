type Props = {
  src: string;
};

export function ImagePreview({ src }: Props) {
  return (
    <img
      src={src}
      alt="Imagem carregada"
      style={{
        maxWidth: 800,
        height: "auto",
        border: "1px solid #ddd",
        display: "block",
      }}
    />
  );
}
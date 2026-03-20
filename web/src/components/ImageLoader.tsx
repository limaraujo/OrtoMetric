import { forwardRef, useImperativeHandle, useRef } from "react";

type Props = {
  onPick: (file: File) => void;
};

export type ImageLoaderHandle = {
  open: () => void;
};

export const ImageLoader = forwardRef<ImageLoaderHandle, Props>(
  ({ onPick }, ref) => {
    const inputRef = useRef<HTMLInputElement | null>(null);

    useImperativeHandle(ref, () => ({
      open() {
        inputRef.current?.click();
      },
    }));

    return (
      <input
        ref={inputRef}
        type="file"
        accept="image/png, image/jpeg"
        style={{ display: "none" }}
        onChange={() => {
          const file = inputRef.current?.files?.[0];
          if (!file) return;
          onPick(file);
        }}
      />
    );
  }
);
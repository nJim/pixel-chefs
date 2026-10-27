import { useEffect, useRef, useState } from "preact/hooks";

const imageCache = new Map<string, HTMLImageElement>();

function useImage(src: string): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(() => {
    const cached = imageCache.get(src);
    return cached?.complete ? cached : null;
  });
  useEffect(() => {
    const cached = imageCache.get(src) ?? new Image();
    if (!imageCache.has(src)) {
      cached.src = src;
      imageCache.set(src, cached);
    }
    if (cached.complete) setImg(cached);
    else cached.onload = () => setImg(cached);
  }, [src]);
  return img;
}

/**
 * Draws `src` as a `blocks` × `blocks` grid of pixels (0 = full resolution).
 * Downsampling into a tiny canvas averages each block; scaling back up with
 * smoothing off gives crisp square pixels.
 */
export function PixelImage({ src, blocks, size = 320, label }: { src: string; blocks: number; size?: number; label: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const img = useImage(src);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const px = Math.round(size * dpr);
    if (el.width !== px) el.width = el.height = px;
    const g = el.getContext("2d");
    if (!g) return;

    g.fillStyle = "#08200D";
    g.fillRect(0, 0, px, px);
    if (!img) return;

    if (blocks === 0) {
      g.imageSmoothingEnabled = true;
      g.imageSmoothingQuality = "high";
      g.drawImage(img, 0, 0, px, px);
      return;
    }

    const small = document.createElement("canvas");
    small.width = small.height = blocks;
    const s = small.getContext("2d");
    if (!s) return;
    s.imageSmoothingEnabled = true;
    s.imageSmoothingQuality = "high";
    s.drawImage(img, 0, 0, blocks, blocks);

    g.imageSmoothingEnabled = false;
    g.drawImage(small, 0, 0, px, px);

    // Faint grid lines on chunky stages for that 8-bit sprite look.
    if (blocks <= 20) {
      g.fillStyle = "rgba(8, 32, 13, 0.18)";
      const step = px / blocks;
      const line = Math.max(1, Math.round(dpr));
      for (let i = 1; i < blocks; i++) {
        const at = Math.round(i * step);
        g.fillRect(at, 0, line, px);
        g.fillRect(0, at, px, line);
      }
    }
  }, [img, blocks, size]);

  return (
    <canvas
      ref={canvas}
      role="img"
      aria-label={label}
      class="pc-photo pixelated"
      style={{ width: `${size}px`, height: `${size}px`, maxWidth: "calc(100vw - 56px)", maxHeight: "calc(100vw - 56px)" }}
    />
  );
}

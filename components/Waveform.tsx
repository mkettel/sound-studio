"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface WaveformProps {
  buffer?: AudioBuffer | null;
  duration?: number; // seconds
  progress?: number; // 0..1
  height?: number;
  className?: string;
  onScrub?: (progress: number) => void; // 0..1
}

export default function Waveform({
  buffer,
  duration = 0,
  progress = 0,
  height = 36,
  className = "",
  onScrub,
}: WaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(160);
  const isPointerDownRef = useRef(false);

  // Observe container width
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(Math.max(40, Math.floor(entry.contentRect.width)));
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Build peaks once per buffer
  const peaks = useMemo(() => {
    if (!buffer) return new Float32Array(0);

    const desiredPeaks = 1000; // resolution; independent of width
    const channels = Math.min(2, buffer.numberOfChannels);
    const length = buffer.length;
    const samplesPerPeak = Math.max(1, Math.floor(length / desiredPeaks));

    const tmp = new Float32Array(desiredPeaks);
    for (let i = 0; i < desiredPeaks; i++) {
      let start = i * samplesPerPeak;
      let end = Math.min(length, start + samplesPerPeak);
      let peak = 0;
      for (let ch = 0; ch < channels; ch++) {
        const data = buffer.getChannelData(ch);
        let localPeak = 0;
        for (let s = start; s < end; s++) {
          const v = Math.abs(data[s]);
          if (v > localPeak) localPeak = v;
        }
        peak += localPeak;
      }
      peak = peak / channels;
      tmp[i] = peak;
    }

    // Normalize
    let max = 0;
    for (let i = 0; i < tmp.length; i++) if (tmp[i] > max) max = tmp[i];
    if (max > 0) {
      for (let i = 0; i < tmp.length; i++) tmp[i] = tmp[i] / max;
    }
    return tmp;
  }, [buffer]);

  // Draw when deps change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = width;
    const h = height;
    canvas.width = w;
    canvas.height = h;

    // background transparent
    ctx.clearRect(0, 0, w, h);

    // base waveform
    const baseColor = "rgba(255,255,255,0.25)";
    const fillColor = "rgba(255,255,255,0.9)";

    // Bar-style: one column per pixel (with spacing) or aggregate by step
    const pxStep = Math.max(1, Math.floor(w / 200)); // fewer bars on small widths
    const columns = Math.floor(w / pxStep);
    const progressX = Math.max(0, Math.min(w, Math.floor(progress * w)));

    for (let i = 0; i < columns; i++) {
      const x = i * pxStep + Math.floor(pxStep / 2);
      const t = i / (columns - 1 || 1);
      const pIndex = Math.floor(t * (peaks.length - 1 || 1));
      const amp = peaks[pIndex] || 0;
      const barH = Math.max(1, Math.floor(amp * (h - 2)));
      const y = Math.floor((h - barH) / 2);

      ctx.fillStyle = x <= progressX ? fillColor : baseColor;
      const barW = Math.max(1, pxStep - 1);
      ctx.fillRect(x - Math.floor(barW / 2), y, barW, barH);
    }

    // Handle empty buffer (no peaks)
    if (!buffer || peaks.length === 0) {
      ctx.fillStyle = baseColor;
      const mid = Math.floor(h / 2);
      ctx.fillRect(0, mid, w, 1);
    }
  }, [width, height, peaks, progress, buffer]);

  // Scrub handlers
  const updateFromEvent = (clientX: number) => {
    if (!onScrub) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || width <= 0) return;
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const p = rect.width > 0 ? x / rect.width : 0;
    onScrub(p);
  };

  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    isPointerDownRef.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    updateFromEvent(e.clientX);
  };
  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!isPointerDownRef.current) return;
    updateFromEvent(e.clientX);
  };
  const onPointerUp: React.PointerEventHandler<HTMLDivElement> = (e) => {
    isPointerDownRef.current = false;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return (
    <div
      ref={containerRef}
      className={`w-full select-none ${className}`}
      style={{ height }}
      role={onScrub ? "slider" : undefined}
      aria-valuemin={0}
      aria-valuemax={1}
      aria-valuenow={progress}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}


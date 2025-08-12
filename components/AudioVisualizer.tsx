"use client";

import { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  getFrequencyData: () => Uint8Array;
  width?: number;
  height?: number;
  barCount?: number;
  className?: string;
}

export default function AudioVisualizer({ 
  getFrequencyData, 
  width = 320, 
  height = 120, 
  barCount = 32,
  className = ""
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const frequencyData = getFrequencyData();
      
      // Clear canvas with transparency
      ctx.clearRect(0, 0, width, height);

      if (frequencyData.length === 0) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      const barWidth = width / barCount;
      const dataStep = Math.floor(frequencyData.length / barCount);

      for (let i = 0; i < barCount; i++) {
        const dataIndex = i * dataStep;
        const barHeight = (frequencyData[dataIndex] / 255) * height;
        
        const x = i * barWidth;
        const y = height - barHeight;

        // Create dark gradient for bars
        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, 'rgba(31, 41, 55, 0.8)'); // gray-800 with opacity
        gradient.addColorStop(0.5, 'rgba(55, 65, 81, 0.9)'); // gray-700 with opacity
        gradient.addColorStop(1, 'rgba(75, 85, 99, 1)'); // gray-600

        ctx.fillStyle = gradient;
        ctx.fillRect(x + 1, y, barWidth - 2, barHeight);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [getFrequencyData, width, height, barCount]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`rounded ${className}`}
      style={{ background: 'transparent' }}
    />
  );
}
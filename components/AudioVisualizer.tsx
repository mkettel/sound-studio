"use client";

import { useEffect, useRef, useState } from 'react';

interface AudioVisualizerProps {
  getFrequencyData: () => Uint8Array;
  height?: number;
  className?: string;
}

export default function AudioVisualizer({ 
  getFrequencyData, 
  height = 120,
  className = ""
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const scrollOffsetRef = useRef<number>(0);
  const [dimensions, setDimensions] = useState({ width: 120, height: height });

  // ResizeObserver to detect container size changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width } = entry.contentRect;
        setDimensions({ width: Math.floor(width), height });
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height: canvasHeight } = dimensions;
    
    // Calculate optimal bar count based on width
    const barCount = Math.max(10, Math.min(100, Math.floor(width / 8)));

    const draw = () => {
      const frequencyData = getFrequencyData();
      
      // Clear canvas with transparency
      ctx.clearRect(0, 0, width, height);

      // Check if any audio is playing (any frequency data above threshold)
      const hasAudio = frequencyData.some(value => value > 10);

      if (!hasAudio) {
        // Draw blocky digital AUW
        const blockSize = Math.max(8, Math.floor(canvasHeight / 8));
        const letterSpacing = blockSize * 1.5;
        const letterHeight = blockSize * 7;
        const letterWidth = blockSize * 5;
        
        // Calculate starting position to center all letters (A, U, W)
        const totalWidth = letterWidth * 3 + letterSpacing * 2;
        const startX = (width - totalWidth) / 2;
        const startY = (canvasHeight - letterHeight) / 2;
        
        // Digital display colors
        const onColor = 'rgba(31, 41, 55, 0.9)'; // dark gray/black
        const dimColor = 'rgba(75, 85, 99, 0.15)'; // very dim gray
        
        // Letter A pattern (5x7 grid)
        const letterA = [
          [0,1,1,1,0],
          [1,0,0,0,1],
          [1,0,0,0,1],
          [1,1,1,1,1],
          [1,0,0,0,1],
          [1,0,0,0,1],
          [1,0,0,0,1]
        ];
        
        // Letter U pattern (5x7 grid)
        const letterU = [
          [1,0,0,0,1],
          [1,0,0,0,1],
          [1,0,0,0,1],
          [1,0,0,0,1],
          [1,0,0,0,1],
          [1,0,0,0,1],
          [0,1,1,1,0]
        ];
        
        // Letter W pattern (5x7 grid)
        const letterW = [
          [1,0,0,0,1],
          [1,0,0,0,1],
          [1,0,0,0,1],
          [1,0,1,0,1],
          [1,0,1,0,1],
          [1,1,0,1,1],
          [1,0,0,0,1]
        ];
        
        const letters = [letterA, letterU, letterW];
        
        // Draw each letter
        letters.forEach((letter, letterIndex) => {
          const letterX = startX + letterIndex * (letterWidth + letterSpacing);
          
          letter.forEach((row, rowIndex) => {
            row.forEach((pixel, colIndex) => {
              const x = letterX + colIndex * blockSize;
              const y = startY + rowIndex * blockSize;
              
              // Draw block with slight gap between pixels
              ctx.fillStyle = pixel ? onColor : dimColor;
              ctx.fillRect(x, y, blockSize - 1, blockSize - 1);
              
              // Add slight inner highlight for lit pixels
              if (pixel) {
                ctx.fillStyle = 'rgba(75, 85, 99, 0.3)'; // lighter gray highlight
                ctx.fillRect(x + 1, y + 1, blockSize - 3, blockSize - 3);
              }
            });
          });
        });
        
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      // Draw frequency bars
      const barWidth = width / barCount;
      const dataStep = Math.floor(frequencyData.length / barCount);

      for (let i = 0; i < barCount; i++) {
        const dataIndex = i * dataStep;
        const barHeight = (frequencyData[dataIndex] / 255) * canvasHeight;
        
        const x = i * barWidth;
        const y = canvasHeight - barHeight;

        // Create dark gradient for bars
        const gradient = ctx.createLinearGradient(0, canvasHeight, 0, 0);
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
  }, [getFrequencyData, dimensions]);

  return (
    <div 
      ref={containerRef}
      className={`w-full ${className}`}
      style={{ height: `${height}px` }}
    >
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="rounded w-full h-full"
        style={{ background: 'transparent' }}
      />
    </div>
  );
}
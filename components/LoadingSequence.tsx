"use client";

import { useState, useEffect, useRef } from 'react';

interface LoadingSequenceProps {
  onComplete: () => void;
}

export default function LoadingSequence({ onComplete }: LoadingSequenceProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const totalFrames = 60; // frames 00-59
  const frameDuration = 33; // ~30fps (33ms between frames)

  useEffect(() => {
    // Preload all images
    const preloadImages = () => {
      const promises = [];
      for (let i = 0; i < totalFrames; i++) {
        const frameNumber = i.toString().padStart(2, '0');
        const img = new Image();
        img.src = `/loader/AUW Listening Experience Loader 1 lights${frameNumber}.png`;
        promises.push(
          new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve; // Don't fail if image doesn't load
          })
        );
      }
      return Promise.all(promises);
    };

    // Start animation after preloading
    preloadImages().then(() => {
      startTimeRef.current = Date.now();
      
      intervalRef.current = setInterval(() => {
        setCurrentFrame((prev) => {
          if (prev >= totalFrames - 1) {
            // Animation complete
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            setTimeout(() => {
              setIsComplete(true);
              onComplete();
            }, 300); // Small delay before transitioning
            return totalFrames - 1;
          }
          return prev + 1;
        });
      }, frameDuration);
    });

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [onComplete, totalFrames, frameDuration]);

  const frameNumber = currentFrame.toString().padStart(2, '0');
  const imageSrc = `/loader/AUW Listening Experience Loader 1 lights${frameNumber}.png`;

  return (
    <div 
      className={`fixed inset-0 z-50 bg-black flex items-center justify-center transition-opacity duration-500 ${
        isComplete ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        <img
          src={imageSrc}
          alt={`Loading frame ${currentFrame + 1}`}
          className="max-w-full max-h-full object-contain"
          style={{ 
            imageRendering: 'crisp-edges',
            width: '100vw',
            height: '100vh',
            objectFit: 'cover'
          }}
        />
        
        {/* Optional loading indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="text-white text-sm font-mono opacity-60">
            {Math.round((currentFrame / (totalFrames - 1)) * 100)}%
          </div>
        </div>
      </div>
    </div>
  );
}
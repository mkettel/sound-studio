"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";

interface VideoSegment {
  id: string;
  label: string;
  frame: number; // Frame index instead of timestamp here
}

interface VideoScrubberFramesProps {
  frameCount?: number;
  segments?: VideoSegment[];
}

// Map your sequence positions to frames
const defaultSegments: VideoSegment[] = [
  { id: "home", label: "HOME", frame: 0 },                    // Wide shot starting position
  { id: "left-record", label: "LEFT RECORD", frame: 75 },     // Left turntable detail
  { id: "control-panel", label: "CONTROL PANEL", frame: 154 }, // Center console detail  
  { id: "right-record", label: "RIGHT RECORD", frame: 225 }   // Right turntable detail
];

export default function VideoScrubberFrames({
  frameCount = 300,
  segments = defaultSegments,
}: VideoScrubberFramesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [activeSegment, setActiveSegment] = useState<string>("home");
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Image cache and loading
  const images = useRef<HTMLImageElement[]>([]);
  const loadedCount = useRef(0);

  // Animation controller (like Apple's example)
  const frameController = useRef({ frame: 0 });
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  // Generate frame path
  const getFramePath = (index: number): string => {
    return `/frames-premium/frame_${(index + 1).toString().padStart(4, '0')}.jpg`;
  };

  // Render function (exactly like Apple's technique)
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    
    if (!canvas || !context) return;
    
    const frameIndex = Math.round(frameController.current.frame);
    const image = images.current[frameIndex];
    
    if (image && image.complete) {
      // Clear and draw new frame
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
    }
  }, []);

  // Get available navigation options based on current position
  const getAvailableButtons = (currentSegment: string): string[] => {
    switch(currentSegment) {
      case "home":
        // From wide shot, can go to any detail view
        return ["left-record", "control-panel", "right-record"];
        
      case "left-record":
      case "control-panel": 
      case "right-record":
        // From any detail view, can only return home
        return ["home"];
        
      default:
        return ["home"];
    }
  };

  // Get segments available for current position
  const availableSegments = segments.filter(segment => 
    getAvailableButtons(activeSegment).includes(segment.id)
  );

  // Navigate to segment with GSAP
  const navigateToSegment = (segment: VideoSegment) => {
    setActiveSegment(segment.id);
    setIsTransitioning(true);

    // Kill existing animation
    if (tlRef.current) {
      tlRef.current.kill();
    }

    // Calculate smooth duration based on distance
    const distance = Math.abs(segment.frame - frameController.current.frame);
    const duration = Math.max(0.6, distance / frameCount * 3.5); // Smooth timing

    // Create GSAP timeline (like Apple)
    tlRef.current = gsap.timeline({
      onUpdate: render,
      onComplete: () => {
        setIsTransitioning(false);
      }
    });

    // Animate frame with smooth easing
    tlRef.current.to(frameController.current, {
      frame: segment.frame,
      duration: duration,
      ease: "power2.out",
      snap: "frame" // Ensure integer frame values
    });
  };

  // Optimized progressive loading
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size (adjust to your frame dimensions)
    canvas.width = 1920;
    canvas.height = 1080;

    // Priority loading strategy
    const priorityFrames = segments.map(s => s.frame); // Load button frames first
    const loadQueue: number[] = [];

    // Add priority frames first
    priorityFrames.forEach(frame => {
      if (!loadQueue.includes(frame)) {
        loadQueue.push(frame);
      }
    });

    // Add remaining frames
    for (let i = 0; i < frameCount; i++) {
      if (!loadQueue.includes(i)) {
        loadQueue.push(i);
      }
    }

    // Load images progressively
    const loadImage = (frameIndex: number): Promise<void> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          images.current[frameIndex] = img;
          loadedCount.current++;
          setLoadProgress((loadedCount.current / frameCount) * 100);
          
          // Render first frame when loaded
          if (frameIndex === 0) {
            render();
          }
          
          // Mark as loaded when priority frames are ready
          if (loadedCount.current >= priorityFrames.length && !isLoaded) {
            setIsLoaded(true);
          }
          
          resolve();
        };
        
        img.onerror = () => {
          console.warn(`Failed to load frame ${frameIndex}`);
          resolve();
        };
        
        img.src = getFramePath(frameIndex);
      });
    };

    // Load priority frames first, then continue in background
    const loadPriorityFrames = async () => {
      // Load key frames first (for immediate interaction)
      for (const frameIndex of priorityFrames) {
        await loadImage(frameIndex);
      }
      
      // Continue loading remaining frames in background
      const remainingFrames = loadQueue.filter(f => !priorityFrames.includes(f));
      
      // Load in chunks to avoid overwhelming browser
      const chunkSize = 5;
      for (let i = 0; i < remainingFrames.length; i += chunkSize) {
        const chunk = remainingFrames.slice(i, i + chunkSize);
        await Promise.all(chunk.map(loadImage));
        
        // Small delay between chunks
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    };

    loadPriorityFrames();

    return () => {
      if (tlRef.current) {
        tlRef.current.kill();
      }
    };
  }, [frameCount, segments, render, isLoaded]);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover"
        style={{
          transform: "translateZ(0)",
          willChange: "transform"
        }}
      />
      
      {/* Navigation Buttons */}
      {isLoaded && (
        <div className="absolute  bottom-0 right-0 z-10">
          <div className="bg-gradient-to-t from-black/80 via-black/60 to-transparent h-0 flex items-end">
            <div className="w-full flex justify-end pb-2">
              <div className="flex flex-col gap-1">
                {availableSegments.map((segment) => (
                  <button
                    key={segment.id}
                    onClick={() => navigateToSegment(segment)}
                    disabled={isTransitioning}
                    className={`
                      relative px-6 py-3 text-md font-bold tracking-widest
                      transition-all duration-200 ease-out
                      border backdrop-blur-sm rounded-md
                      ${activeSegment === segment.id 
                        ? 'bg-amber-500/30 border-amber-400/80 text-amber-100 shadow-lg shadow-amber-500/20' 
                        : 'bg-stone-800/40 border-stone-400/60 text-stone-200 hover:bg-stone-700/50 hover:border-stone-300'
                      }
                      ${segment.id === 'home' ? 'bg-gray-600/40 border-gray-400/60 hover:bg-gray-500/50' : ''}
                      uppercase
                      hover:shadow-lg hover:shadow-white/10
                      active:scale-95
                      disabled:opacity-70
                    `}
                    style={{
                      textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                      fontFamily: 'monospace',
                      letterSpacing: '0.15em'
                    }}
                  >
                    {segment.id === 'home' && activeSegment !== 'home' ? '← BACK TO HOME' : segment.label}
                    
                    {/* LED indicator */}
                    {activeSegment === segment.id && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse shadow-lg shadow-amber-400/50" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Progress */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-center text-white">
            <div className="text-lg mb-4">Loading frames...</div>
            <div className="w-64 h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-400 transition-all duration-300"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
            <div className="text-sm mt-2 text-white/60">
              {Math.round(loadProgress)}% ({loadedCount.current}/{frameCount})
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
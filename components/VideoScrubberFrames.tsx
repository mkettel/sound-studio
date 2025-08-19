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

// New transition-based frame mapping
const frameSegments = {
  wideLoop: { start: 1, end: 30 },           // Wide position loop
  wideToLeft: { start: 30, end: 80 },        // Wide → Left transition
  leftLoop: { start: 80, end: 110 },         // Left position loop  
  leftToRight: { start: 110, end: 170 },     // Left → Right transition
  rightLoop: { start: 170, end: 200 },       // Right position loop
  rightToWide: { start: 200, end: 260 }      // Right → Wide transition
};

// Map your sequence positions to frame ranges
const defaultSegments: VideoSegment[] = [
  { id: "home", label: "HOME", frame: 1 },                    // Wide shot starting position
  { id: "left-record", label: "LEFT RECORD", frame: 80 },     // Left turntable detail
  { id: "right-record", label: "RIGHT RECORD", frame: 170 }   // Right turntable detail
];

export default function VideoScrubberFrames({
  frameCount = 260,
  segments = defaultSegments,
}: VideoScrubberFramesProps) {
  console.log("🎬 VideoScrubberFrames component loaded!");
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [activeSegment, setActiveSegment] = useState<string>("home");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLooping, setIsLooping] = useState(true);

  // Image cache and loading
  const images = useRef<HTMLImageElement[]>([]);
  const loadedCount = useRef(0);

  // Animation controller (like Apple's example)
  const frameController = useRef({ frame: 1 });
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  // Generate frame path using optimized JPG frames
  const getFramePath = (index: number): string => {
    const frameNumber = index.toString().padStart(4, '0');
    
    // All frames now use optimized JPG versions
    if (index >= 1 && index <= 30) {
      return `/frames-new-optimized/AUW Web Sequence wide loop Test 1/${frameNumber}.jpg`;
    } else if (index >= 30 && index <= 80) {
      return `/frames-new-optimized/AUW Web Sequence transition wide to left Test 1/${frameNumber}.jpg`;
    } else if (index >= 80 && index <= 110) {
      return `/frames-new-optimized/AUW Web Sequence loop left Test 1/${frameNumber}.jpg`;
    } else if (index >= 110 && index <= 170) {
      return `/frames-new-optimized/AUW Web Sequence transition left right Test 1/${frameNumber}.jpg`;
    } else if (index >= 170 && index <= 200) {
      return `/frames-new-optimized/AUW Web Sequence loop right Test 1/${frameNumber}.jpg`;
    } else if (index >= 200 && index <= 260) {
      return `/frames-new-optimized/AUW Web Sequence Transition right to wide Test 1/${frameNumber}.jpg`;
    }
    
    // Fallback to first frame
    return `/frames-new-optimized/AUW Web Sequence wide loop Test 1/0001.jpg`;
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
        // From wide shot, can go to left or right
        return ["left-record", "right-record"];
        
      case "left-record":
        // From left view, can go to right or back home
        return ["home", "right-record"];
        
      case "right-record":
        // From right view, can go to left or back home  
        return ["home", "left-record"];
        
      default:
        return ["home"];
    }
  };

  // Get loop frames for a position
  const getLoopFrames = (position: string): number[] => {
    switch(position) {
      case "home":
        // Wide loop: frames 1-30
        return Array.from({ length: 30 }, (_, i) => 1 + i);
      case "left-record":
        // Left loop: frames 80-110  
        return Array.from({ length: 31 }, (_, i) => 80 + i);
      case "right-record":
        // Right loop: frames 170-200
        return Array.from({ length: 31 }, (_, i) => 170 + i);
      default:
        return [1]; // Fallback to first frame
    }
  };

  // Get transition frames for movement between positions
  const getTransitionFrames = (from: string, to: string): number[] => {
    if (from === "home" && to === "left-record") {
      // Wide to Left: frames 30-80
      return Array.from({ length: 51 }, (_, i) => 30 + i);
    } else if (from === "left-record" && to === "home") {
      // Left to Wide (reverse): frames 80-30
      return Array.from({ length: 51 }, (_, i) => 80 - i);
    } else if (from === "left-record" && to === "right-record") {
      // Left to Right: frames 110-170
      return Array.from({ length: 61 }, (_, i) => 110 + i);
    } else if (from === "right-record" && to === "left-record") {
      // Right to Left (reverse): frames 170-110
      return Array.from({ length: 61 }, (_, i) => 170 - i);
    } else if (from === "right-record" && to === "home") {
      // Right to Wide: frames 200-260, then jump back to wide start
      const rightToWideFrames = Array.from({ length: 61 }, (_, i) => 200 + i);
      return [...rightToWideFrames, 1]; // End at wide position
    } else if (from === "home" && to === "right-record") {
      // Wide to Right: We need to go through left first, or create direct path
      // For now, let's create a direct wide-to-right path using reverse of right-to-wide
      return Array.from({ length: 61 }, (_, i) => 260 - i);
    }
    
    return []; // No transition needed
  };

  // Get segments available for current position
  const availableSegments = segments.filter(segment => 
    getAvailableButtons(activeSegment).includes(segment.id)
  );

  // Start looping animation for current position
  const startPositionLoop = (position: string) => {
    console.log(`🔄 Starting loop for position: ${position}, isLooping: ${isLooping}`);
    
    if (!isLooping) {
      console.log("❌ Loop cancelled - isLooping is false");
      return;
    }
    
    const loopFrames = getLoopFrames(position);
    console.log(`📍 Loop frames for ${position}:`, loopFrames);
    
    if (loopFrames.length <= 1) {
      console.log("❌ Loop cancelled - not enough frames");
      return;
    }

    // Kill existing animation
    if (tlRef.current) {
      console.log("🛑 Killing existing animation");
      tlRef.current.kill();
    }

    // Create infinite loop animation
    tlRef.current = gsap.timeline({
      repeat: -1, // Infinite loop
      onUpdate: render,
      onStart: () => console.log(`✅ Loop animation started for ${position}`),
      onRepeat: () => console.log(`🔁 Loop repeating for ${position}`)
    });

    // Cycle through loop frames smoothly
    const duration = loopFrames.length * 0.1; // Slower, more subtle
    console.log(`⏱️ Loop duration: ${duration}s for ${loopFrames.length} frames`);
    
    tlRef.current.to(frameController.current, {
      frame: loopFrames[loopFrames.length - 1],
      duration: duration,
      ease: "none", // Linear for smooth looping
      snap: "frame",
      onUpdate: () => {
        // Map progress to loop frame sequence
        const progress = tlRef.current!.progress();
        const frameIndex = Math.floor(progress * (loopFrames.length - 1));
        frameController.current.frame = loopFrames[frameIndex];
      }
    });
  };

  // Navigate to segment with transition animation
  const navigateToSegment = (segment: VideoSegment) => {
    console.log(`🚀 Navigation: ${activeSegment} → ${segment.id}`);
    
    setIsTransitioning(true);
    setIsLooping(false); // Stop looping during transition
    console.log("🛑 Stopping loops for transition");

    // Kill existing animation
    if (tlRef.current) {
      console.log("🛑 Killing existing animation for transition");
      tlRef.current.kill();
    }

    // Get transition frames
    const transitionFrames = getTransitionFrames(activeSegment, segment.id);
    console.log(`🎬 Transition frames (${activeSegment} → ${segment.id}):`, transitionFrames);
    
    if (transitionFrames.length === 0) {
      console.log("⚡ Direct jump - no transition needed");
      // Direct jump (no transition)
      frameController.current.frame = segment.frame;
      setActiveSegment(segment.id);
      setIsTransitioning(false);
      setIsLooping(true);
      // Start loop after a brief delay
      setTimeout(() => {
        console.log("🔄 Starting loop after direct jump");
        startPositionLoop(segment.id);
      }, 100);
      render();
      return;
    }

    console.log(`🎬 Starting transition animation (${transitionFrames.length} frames)`);

    // Create GSAP timeline for smooth transition
    tlRef.current = gsap.timeline({
      onUpdate: render,
      onStart: () => console.log("✅ Transition animation started"),
      onComplete: () => {
        console.log(`🏁 Transition complete: now at ${segment.id}`);
        setActiveSegment(segment.id);
        setIsTransitioning(false);
        setIsLooping(true);
        // Start position loop after transition
        setTimeout(() => {
          console.log("🔄 Starting loop after transition");
          startPositionLoop(segment.id);
        }, 100);
      }
    });

    // Animate through each transition frame
    const duration = Math.max(1.0, transitionFrames.length * 0.03); // ~30fps feeling
    console.log(`⏱️ Transition duration: ${duration}s`);
    
    tlRef.current.to(frameController.current, {
      frame: transitionFrames[transitionFrames.length - 1],
      duration: duration,
      ease: "power2.inOut",
      snap: "frame",
      onUpdate: () => {
        // Map progress to frame sequence
        const progress = tlRef.current!.progress();
        const frameIndex = Math.floor(progress * (transitionFrames.length - 1));
        frameController.current.frame = transitionFrames[frameIndex];
      }
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

    // Add remaining frames (starting from 1, not 0)
    for (let i = 1; i <= frameCount; i++) {
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
          
          console.log(`📸 Frame ${frameIndex} loaded (${loadedCount.current}/${frameCount})`);
          
          // Render first frame when loaded
          if (frameIndex === 1) {
            console.log("🎬 First frame rendered!");
            render();
          }
          
          // Mark as loaded when priority frames are ready
          if (loadedCount.current >= priorityFrames.length && !isLoaded) {
            console.log(`✅ Priority frames loaded! Setting isLoaded to true (${loadedCount.current}/${priorityFrames.length})`);
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

  // Start initial loop when loaded
  useEffect(() => {
    console.log(`🎯 useEffect triggered - isLoaded: ${isLoaded}, isTransitioning: ${isTransitioning}, activeSegment: ${activeSegment}`);
    
    if (isLoaded && !isTransitioning) {
      console.log("🎬 Conditions met - starting initial loop");
      startPositionLoop(activeSegment);
    } else {
      console.log("⏳ Waiting for conditions - not starting loop yet");
    }
  }, [isLoaded, activeSegment, isTransitioning]);

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
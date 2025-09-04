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

// New transition-based frame mapping using actual frame numbers
const frameSegments = {
  wideLoop: { start: 0, end: 29 },           // Wide position loop (frames 0000-0029)
  wideToLeft: { start: 30, end: 78 },        // Wide → Left transition (frames 0030-0078)
  leftLoop: { start: 79, end: 118 },         // Left position loop (frames 0079-0118)
  leftToRight: { start: 119, end: 188 },     // Left → Right transition (frames 0119-0188)
  rightLoop: { start: 189, end: 228 },       // Right position loop (frames 0189-0228)
  rightToWide: { start: 229, end: 278 }      // Right → Wide transition (frames 0229-0278)
};

// Map your sequence positions to frame ranges
const defaultSegments: VideoSegment[] = [
  { id: "home", label: "HOME", frame: 0 },                    // Wide shot starting position
  { id: "left-record", label: "LEFT RECORD", frame: 79 },     // Left turntable detail
  { id: "right-record", label: "RIGHT RECORD", frame: 189 }   // Right turntable detail
];

export default function VideoScrubberFrames({
  frameCount = 278,
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
  const frameController = useRef({ frame: 0 });
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  // Generate frame path using optimized JPG frames with original sequence numbers
  const getFramePath = (index: number): string => {
    const frameNumber = index.toString().padStart(5, '0');
    
    // All frames now use higher quality optimized JPG versions
    if (index >= 0 && index <= 29) {
      return `/frames-new-optimized/AUW Listening Experience - loop wide Test 1/AUW Listening Experience - loop wide lq_${frameNumber}.jpg`;
    } else if (index >= 30 && index <= 78) {
      return `/frames-new-optimized/AUW Listening Experience - wide to left Test 1/AUW Listening Experience - wide to left lq_${frameNumber}.jpg`;
    } else if (index >= 79 && index <= 118) {
      return `/frames-new-optimized/AUW Listening Experience - loop left Test 1/AUW Listening Experience - loop left lq_${frameNumber}.jpg`;
    } else if (index >= 119 && index <= 188) {
      return `/frames-new-optimized/AUW Listening Experience - left to right Test 1/AUW Listening Experience - left to right lq_${frameNumber}.jpg`;
    } else if (index >= 189 && index <= 228) {
      return `/frames-new-optimized/AUW Listening Experience - loop right Test 1/AUW Listening Experience - loop right lq_${frameNumber}.jpg`;
    } else if (index >= 229 && index <= 278) {
      return `/frames-new-optimized/AUW Listening Experience - right to wide Test 1/AUW Listening Experience - right to wide lq_${frameNumber}.jpg`;
    }
    
    // Fallback to first frame
    return `/frames-new-optimized/AUW Listening Experience - loop wide Test 1/AUW Listening Experience - loop wide lq_00000.jpg`;
  };

  // Render function (back to simple scaling)
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
        // Wide loop: frames 0-29
        return Array.from({ length: 30 }, (_, i) => 0 + i);
      case "left-record":
        // Left loop: frames 79-118  
        return Array.from({ length: 40 }, (_, i) => 79 + i);
      case "right-record":
        // Right loop: frames 189-228
        return Array.from({ length: 40 }, (_, i) => 189 + i);
      default:
        return [0]; // Fallback to first frame
    }
  };

  // Get transition frames for movement between positions
  const getTransitionFrames = (from: string, to: string): number[] => {
    if (from === "home" && to === "left-record") {
      // Wide to Left: frames 30-78
      return Array.from({ length: 49 }, (_, i) => 30 + i);
    } else if (from === "left-record" && to === "home") {
      // Left to Wide (reverse): frames 78-30
      return Array.from({ length: 49 }, (_, i) => 78 - i);
    } else if (from === "left-record" && to === "right-record") {
      // Left to Right: frames 119-188
      return Array.from({ length: 70 }, (_, i) => 119 + i);
    } else if (from === "right-record" && to === "left-record") {
      // Right to Left (reverse): frames 188-119
      return Array.from({ length: 70 }, (_, i) => 188 - i);
    } else if (from === "right-record" && to === "home") {
      // Right to Wide: frames 229-278, then jump back to wide start
      const rightToWideFrames = Array.from({ length: 50 }, (_, i) => 229 + i);
      return [...rightToWideFrames, 0]; // End at wide position
    } else if (from === "home" && to === "right-record") {
      // Wide to Right: We need to go through left first, or create direct path
      // For now, let's create a direct wide-to-right path using reverse of right-to-wide
      return Array.from({ length: 50 }, (_, i) => 278 - i);
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

    // Set canvas size to match new frame aspect ratio (2560x1600 = 16:10)
    canvas.width = 2560;
    canvas.height = 1600;

    // Priority loading strategy
    const priorityFrames = segments.map(s => s.frame); // Load button frames first
    const loadQueue: number[] = [];

    // Add priority frames first
    priorityFrames.forEach(frame => {
      if (!loadQueue.includes(frame)) {
        loadQueue.push(frame);
      }
    });

    // Add remaining frames (starting from 0)
    for (let i = 0; i <= frameCount; i++) {
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
          if (frameIndex === 0) {
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
        <div className="absolute w-full bottom-0 right-0 z-10">
          <div className="flex w-full ">
            <div className="w-full flex">
              <div className="flex w-full">
                {/* Left Button - Dynamic based on position */}
                <button
                  onClick={() => {
                    if (activeSegment === 'home') {
                      navigateToSegment({ id: 'left-record', label: 'LEFT RECORD', frame: 79 });
                    } else if (activeSegment === 'right-record') {
                      navigateToSegment({ id: 'left-record', label: 'LEFT RECORD', frame: 79 });
                    }
                    // Don't do anything if already at left-record
                  }}
                  disabled={isTransitioning}
                  className={`
                    relative px-6 py-3 text-md font-medium
                    transition-all duration-200 ease-out
                    border-t backdrop-blur-sm
                    text-white
                    ${activeSegment === 'left-record' 
                      ? 'bg-white/30' 
                      : ''
                    }
                    uppercase
                    hover:bg-white/20
                    disabled:opacity-70
                    w-1/3
                  `}
                >
                  LEFT RECORD
                  
                  {/* LED indicator */}
                  {/* {activeSegment === 'left-record' && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse shadow-lg shadow-amber-400/50" />
                  )} */}
                </button>

                {/* Middle Button - Always Wide Shot */}
                <button
                  onClick={() => navigateToSegment({ id: 'home', label: 'WIDE SHOT', frame: 0 })}
                  disabled={isTransitioning}
                  className={`
                    relative px-6 py-3 text-md font-medium
                    transition-all duration-200 ease-out
                    border-t backdrop-blur-sm
                    text-white
                    ${activeSegment === 'home' 
                      ? 'bg-white/20' 
                      : ''
                    }
                    uppercase
                    hover:bg-white/20
                    disabled:opacity-70
                    w-1/3
                  `}
                >
                  WIDE SHOT
                  
                  {/* LED indicator */}
                  {/* {activeSegment === 'home' && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 z-20 rounded-full animate-pulse shadow-lg shadow-amber-400/50" />
                  )} */}
                </button>

                {/* Right Button - Dynamic based on position */}
                <button
                  onClick={() => {
                    if (activeSegment === 'home') {
                      navigateToSegment({ id: 'right-record', label: 'RIGHT RECORD', frame: 189 });
                    } else if (activeSegment === 'left-record') {
                      navigateToSegment({ id: 'right-record', label: 'RIGHT RECORD', frame: 189 });
                    }
                    // Don't do anything if already at right-record
                  }}
                  disabled={isTransitioning}
                  className={`
                    relative px-6 py-3 text-md font-medium
                    transition-all duration-200 ease-out
                    text-white
                    border-t backdrop-blur-sm
                    ${activeSegment === 'right-record' 
                      ? 'bg-white/20' 
                      : ''
                    }
                    uppercase
                    hover:bg-white/20
                    disabled:opacity-70
                    w-1/3
                  `}
                >
                  RIGHT RECORD
                  
                  {/* LED indicator */}
                  {/* {activeSegment === 'right-record' && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse shadow-lg shadow-amber-400/50" />
                  )} */}
                </button>
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
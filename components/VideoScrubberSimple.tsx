"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface VideoSegment {
  id: string;
  label: string;
  timestamp: number;
}

interface VideoScrubberSimpleProps {
  videoSrc: string;
  segments?: VideoSegment[];
}

const defaultSegments: VideoSegment[] = [
  { id: "home", label: "HOME", timestamp: 0 },
  { id: "left-record", label: "LEFT RECORD", timestamp: 1 },
  { id: "control-panel", label: "CONTROL PANEL", timestamp: 2 },
  { id: "right-record", label: "RIGHT RECORD", timestamp: 3 }
];

export default function VideoScrubberSimple({
  videoSrc,
  segments = defaultSegments,
}: VideoScrubberSimpleProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeSegment, setActiveSegment] = useState<string>("home");
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Simple animation state
  const animationRef = useRef<number | null>(null);
  const startTime = useRef<number>(0);
  const startPosition = useRef<number>(0);
  const targetPosition = useRef<number>(0);
  const duration = useRef<number>(800);

  // Simple easing function
  const easeOutQuart = (t: number): number => {
    return 1 - Math.pow(1 - t, 4);
  };

  // Animation loop
  const animate = useCallback((timestamp: number) => {
    const video = videoRef.current;
    if (!video || !video.duration) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    if (startTime.current === 0) {
      startTime.current = timestamp;
    }

    const elapsed = timestamp - startTime.current;
    const progress = Math.min(elapsed / duration.current, 1);
    const easedProgress = easeOutQuart(progress);

    // Interpolate between start and target
    const currentPos = startPosition.current + 
      (targetPosition.current - startPosition.current) * easedProgress;

    // Update video time
    video.currentTime = currentPos;

    if (progress < 1) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      // Animation complete
      setIsTransitioning(false);
      animationRef.current = null;
      startTime.current = 0;
    }
  }, []);

  // Navigate to segment
  const navigateToSegment = useCallback((segment: VideoSegment) => {
    const video = videoRef.current;
    if (!video || !video.duration) return;

    setActiveSegment(segment.id);
    setIsTransitioning(true);

    // Stop current animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // Set up new animation
    startPosition.current = video.currentTime;
    targetPosition.current = segment.timestamp;
    startTime.current = 0;

    // Simple duration based on distance
    const distance = Math.abs(targetPosition.current - startPosition.current);
    duration.current = Math.max(400, distance * 300);

    // Start animation
    animationRef.current = requestAnimationFrame(animate);
  }, [animate]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setIsLoaded(true);
      video.pause();
      video.preload = "auto";
      video.controls = false;
      
      // Start at 0 seconds
      video.currentTime = 0;
      setActiveSegment("home");
    };

    const handleError = () => {
      console.error("Failed to load video");
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("error", handleError);

    if (video.readyState >= 1) {
      handleLoadedMetadata();
    }

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("error", handleError);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        src={videoSrc}
        className="w-full h-full object-cover"
        muted
        playsInline
        preload="auto"
      />
      
      {/* Navigation Buttons */}
      {isLoaded && (
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <div className="bg-gradient-to-t from-black/80 via-black/60 to-transparent h-32 flex items-end">
            <div className="w-full flex justify-center pb-8">
              <div className="flex gap-6">
                {segments.map((segment) => (
                  <button
                    key={segment.id}
                    onClick={() => navigateToSegment(segment)}
                    disabled={isTransitioning}
                    className={`
                      relative px-6 py-3 text-xs font-bold tracking-widest
                      transition-all duration-200 ease-out
                      border backdrop-blur-sm
                      ${activeSegment === segment.id 
                        ? 'bg-amber-500/30 border-amber-400/80 text-amber-100 shadow-lg shadow-amber-500/20' 
                        : 'bg-stone-800/40 border-stone-400/60 text-stone-200 hover:bg-stone-700/50 hover:border-stone-300'
                      }
                      rounded-none uppercase
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
                    {segment.label}
                    
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

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-white text-lg">Loading video...</div>
        </div>
      )}
    </div>
  );
}
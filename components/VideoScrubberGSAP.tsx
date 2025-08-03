"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

interface VideoSegment {
  id: string;
  label: string;
  timestamp: number;
}

interface VideoScrubberGSAPProps {
  videoSrc: string;
  segments?: VideoSegment[];
}

const defaultSegments: VideoSegment[] = [
  { id: "home", label: "HOME", timestamp: 0 },
  { id: "left-record", label: "LEFT RECORD", timestamp: 4 },
  { id: "control-panel", label: "CONTROL PANEL", timestamp: 6 },
  { id: "right-record", label: "RIGHT RECORD", timestamp: 9 }
];

export default function VideoScrubberGSAP({
  videoSrc,
  segments = defaultSegments,
}: VideoScrubberGSAPProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeSegment, setActiveSegment] = useState<string>("home");
  const [isTransitioning, setIsTransitioning] = useState(false);

  // GSAP timeline ref
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  // Video controller object for GSAP
  const videoController = useRef({ currentTime: 0 });

  // Render function optimized for video
  const render = () => {
    const video = videoRef.current;
    if (video && video.duration) {
      // Throttle video seeking to avoid overwhelming the browser
      const newTime = videoController.current.currentTime;
      const currentVideoTime = video.currentTime;
      
      // Only update if there's a meaningful difference (reduces stuttering)
      if (Math.abs(newTime - currentVideoTime) > 0.016) { // ~60fps threshold
        video.currentTime = newTime;
      }
    }
  };

  // Navigate to segment with GSAP
  const navigateToSegment = (segment: VideoSegment) => {
    const video = videoRef.current;
    if (!video || !video.duration) return;

    setActiveSegment(segment.id);
    setIsTransitioning(true);

    // Kill any existing animation
    if (tlRef.current) {
      tlRef.current.kill();
    }

    // Calculate duration - longer for video to feel smoother
    const distance = Math.abs(segment.timestamp - videoController.current.currentTime);
    const duration = Math.max(0.8, distance * 0.1); // Longer minimum duration for smoother video

    // Create new GSAP timeline with video-optimized settings
    tlRef.current = gsap.timeline({
      onUpdate: render,
      onComplete: () => {
        setIsTransitioning(false);
        // Ensure we land exactly on target
        videoController.current.currentTime = segment.timestamp;
        render();
      }
    });

    // Animate video time with gentle easing optimized for video
    tlRef.current.to(videoController.current, {
      currentTime: segment.timestamp,
      duration: duration,
      ease: "power1.out", // Gentler easing for video
    });
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setIsLoaded(true);
      video.pause();
      video.preload = "auto";
      video.controls = false;
      
      // Video optimization for smooth seeking
      video.playbackRate = 1.0;
      video.defaultPlaybackRate = 1.0;
      
      // Initialize at 0 seconds
      video.currentTime = 0;
      videoController.current.currentTime = 0;
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
      if (tlRef.current) {
        tlRef.current.kill();
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
        style={{
          // Hardware acceleration for smooth playback
          transform: "translateZ(0)",
          willChange: "transform"
        }}
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
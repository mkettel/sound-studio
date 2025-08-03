"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface VideoSegment {
  id: string;
  label: string;
  timestamp: number; // timestamp in seconds
  description?: string;
}

interface VideoScrubberSegmentsProps {
  videoSrc: string;
  segments?: VideoSegment[];
  smoothing?: number;
  baseDuration?: number;
  maxDuration?: number;
  useStaging?: boolean;
  bufferZone?: number;
}

const defaultSegments: VideoSegment[] = [
  {
    id: "left-record",
    label: "LEFT RECORD",
    timestamp: 3,
    description: "Left turntable view"
  },
  {
    id: "control-panel", 
    label: "CONTROL PANEL",
    timestamp: 5,
    description: "Central mixing console"
  },
  {
    id: "right-record",
    label: "RIGHT RECORD", 
    timestamp: 7,
    description: "Right turntable view"
  }
];

export default function VideoScrubberSegments({
  videoSrc,
  segments = defaultSegments,
  smoothing = 0.08,
  baseDuration = 800,
  maxDuration = 2500,
  useStaging = true,
  bufferZone = 0.05,
}: VideoScrubberSegmentsProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionProgress, setTransitionProgress] = useState(0);

  // Animation state
  const targetTime = useRef(0);
  const currentTime = useRef(0);
  const rafId = useRef<number | null>(null);
  const isAnimating = useRef(false);
  const animationStartTime = useRef(0);
  const animationStartValue = useRef(0);
  const animationDuration = useRef(baseDuration);
  const currentVelocity = useRef(0);
  const lastUpdateTime = useRef(0);
  const isEasing = useRef(false);
  
  // Staging state for smooth transitions
  const isStaging = useRef(false);
  const stagingPosition = useRef(0.5); // Start at middle
  const finalTarget = useRef(0);
  const stagePhase = useRef<'staging' | 'final'>('staging');

  // Keyframe optimization
  const lastRenderedTime = useRef(-1);
  const frameThreshold = 1 / 60; // 60fps for smoother playback

  // Professional easing functions
  const easeOutExpo = (t: number): number => {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  };

  const easeOutQuart = (t: number): number => {
    return 1 - Math.pow(1 - t, 4);
  };

  const easeOutBack = (t: number): number => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  };

  // Calculate optimal duration based on distance
  const calculateOptimalDuration = (startPos: number, endPos: number): number => {
    const distance = Math.abs(endPos - startPos);
    
    // Use logarithmic scaling for natural feel
    const scaledDuration = baseDuration + (Math.log(1 + distance * 10) * 200);
    
    return Math.min(maxDuration, Math.max(baseDuration, scaledDuration));
  };

  // Calculate current animation velocity
  const getCurrentVelocity = (): number => {
    const now = Date.now();
    const timeDelta = now - lastUpdateTime.current;
    
    if (timeDelta === 0) return currentVelocity.current;
    
    const positionDelta = targetTime.current - currentTime.current;
    const velocity = positionDelta / (timeDelta / 1000); // positions per second
    
    lastUpdateTime.current = now;
    return velocity;
  };

  // Convert timestamp to normalized position (0-1)
  const timestampToPosition = (timestamp: number): number => {
    const video = videoRef.current;
    if (!video || !video.duration) return 0;
    return Math.min(1, Math.max(0, timestamp / video.duration));
  };

  // Convert normalized position to timestamp
  const positionToTimestamp = (position: number): number => {
    const video = videoRef.current;
    if (!video || !video.duration) return 0;
    return position * video.duration;
  };

  // Get staging position - a buffer zone before the final target
  const getStagingPosition = (target: number, current: number): number => {
    if (!useStaging) return target;
    
    // If the distance is small, don't use staging
    const distance = Math.abs(target - current);
    if (distance < bufferZone * 2) return target;
    
    // Create a staging position slightly before the target
    const direction = target > current ? 1 : -1;
    const stagingOffset = bufferZone * direction;
    
    return Math.max(0, Math.min(1, target - stagingOffset));
  };

  // Snap to nearest keyframe for smoother seeking
  const snapToKeyframe = (position: number): number => {
    const video = videoRef.current;
    if (!video || !video.duration) return position;
    
    // Assume keyframes every 2 seconds (common for web video)
    const keyframeInterval = 2; // seconds
    const totalDuration = video.duration;
    const targetTime = position * totalDuration;
    
    const nearestKeyframe = Math.round(targetTime / keyframeInterval) * keyframeInterval;
    return Math.max(0, Math.min(1, nearestKeyframe / totalDuration));
  };

  const animate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration) {
      rafId.current = requestAnimationFrame(animate);
      return;
    }

    let newCurrentTime = currentTime.current;

    if (isEasing.current) {
      // Calculate easing progress
      const elapsed = Date.now() - animationStartTime.current;
      const progress = Math.min(elapsed / animationDuration.current, 1);
      
      // Use different easing curves based on distance
      const distance = Math.abs(targetTime.current - animationStartValue.current);
      let easedProgress;
      
      if (distance > 0.5) {
        // Long distances use exponential easing for dramatic effect
        easedProgress = easeOutExpo(progress);
      } else if (distance > 0.2) {
        // Medium distances use back easing for slight overshoot
        easedProgress = easeOutBack(progress);
      } else {
        // Short distances use quart easing for smooth feel
        easedProgress = easeOutQuart(progress);
      }
      
      // Interpolate between start and target
      newCurrentTime = animationStartValue.current + 
        (targetTime.current - animationStartValue.current) * easedProgress;
      
      // Update velocity for potential interruptions
      const now = Date.now();
      const timeDelta = now - lastUpdateTime.current;
      if (timeDelta > 0) {
        const positionDelta = newCurrentTime - currentTime.current;
        currentVelocity.current = positionDelta / (timeDelta / 1000);
        lastUpdateTime.current = now;
      }
      
      // Update transition progress for UI feedback
      setTransitionProgress(progress);
      
      if (progress >= 1) {
        // Check if we're in staging mode and need to proceed to final target
        if (isStaging.current && stagePhase.current === 'staging') {
          // Completed staging phase, now move to final target
          stagePhase.current = 'final';
          animationStartTime.current = Date.now();
          animationStartValue.current = currentTime.current;
          targetTime.current = finalTarget.current;
          
          // Shorter duration for final approach
          animationDuration.current = Math.min(animationDuration.current * 0.6, 800);
          
          // Continue animation without clearing easing state
          newCurrentTime = currentTime.current;
        } else {
          // Animation fully complete
          isEasing.current = false;
          isStaging.current = false;
          stagePhase.current = 'staging';
          newCurrentTime = targetTime.current;
          currentVelocity.current = 0;
          setIsTransitioning(false);
          setTransitionProgress(0);
        }
      }
    } else {
      // Standard smooth interpolation for minor adjustments
      const timeDiff = Math.abs(targetTime.current - currentTime.current);
      
      if (timeDiff < 0.001) {
        isAnimating.current = false;
        newCurrentTime = targetTime.current;
        video.currentTime = video.duration * newCurrentTime;
        currentTime.current = newCurrentTime;
        return;
      }
      
      newCurrentTime += (targetTime.current - currentTime.current) * smoothing;
    }

    currentTime.current = newCurrentTime;

    // Calculate actual video time
    const newVideoTime = video.duration * newCurrentTime;

    // Only update if change is significant
    const timeSinceLastRender = Math.abs(newVideoTime - lastRenderedTime.current);
    if (timeSinceLastRender > frameThreshold) {
      video.currentTime = newVideoTime;
      lastRenderedTime.current = newVideoTime;
    }

    // Continue animation
    if (isAnimating.current || isEasing.current) {
      rafId.current = requestAnimationFrame(animate);
    }
  }, [smoothing, baseDuration, maxDuration]);

  const startAnimation = useCallback(() => {
    if (!isAnimating.current) {
      isAnimating.current = true;
      animate();
    }
  }, [animate]);

  const navigateToSegment = useCallback((segment: VideoSegment) => {
    // Convert timestamp to normalized position
    const rawTarget = timestampToPosition(segment.timestamp);
    const currentPos = currentTime.current;
    
    // Snap target to keyframe for smoother seeking
    const keyframeTarget = snapToKeyframe(rawTarget);
    
    // Determine if we should use staging
    const distance = Math.abs(keyframeTarget - currentPos);
    const shouldUseStaging = useStaging && distance > bufferZone * 2;
    
    if (shouldUseStaging) {
      // Two-phase animation: staging then final
      const stagingPos = getStagingPosition(keyframeTarget, currentPos);
      
      isStaging.current = true;
      stagePhase.current = 'staging';
      finalTarget.current = keyframeTarget;
      
      // First phase: move to staging position
      targetTime.current = stagingPos;
      animationDuration.current = calculateOptimalDuration(currentPos, stagingPos);
    } else {
      // Single-phase animation directly to target
      isStaging.current = false;
      targetTime.current = keyframeTarget;
      animationDuration.current = calculateOptimalDuration(currentPos, keyframeTarget);
    }
    
    // Handle interruption smoothly
    if (isEasing.current) {
      // Get current velocity to maintain momentum
      const velocity = getCurrentVelocity();
      
      // Use current position as new start, maintaining some velocity
      animationStartValue.current = currentPos;
      
      // Adjust duration based on current velocity
      const velocityFactor = Math.abs(velocity) * 0.3;
      animationDuration.current = Math.max(
        animationDuration.current * (1 - velocityFactor),
        300 // Minimum duration for smooth feel
      );
    } else {
      // Starting fresh animation
      animationStartValue.current = currentPos;
    }
    
    // Set up new animation
    animationStartTime.current = Date.now();
    isEasing.current = true;
    setActiveSegment(segment.id);
    setIsTransitioning(true);
    setTransitionProgress(0);
    lastUpdateTime.current = Date.now();
    
    startAnimation();
  }, [startAnimation, useStaging, bufferZone]);

  // Preload key frames for instant seeking
  const preloadKeyFrames = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;

    // Create offscreen canvas for frame caching
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 320; // Smaller resolution for caching
    canvas.height = 180;

    // Preload frames at each segment timestamp
    for (const segment of segments) {
      try {
        video.currentTime = segment.timestamp;
        await new Promise(resolve => {
          video.addEventListener('seeked', resolve, { once: true });
        });
        
        // Cache frame data (in a real app, you'd store this)
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Small delay to prevent overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.warn('Failed to preload frame for segment:', segment.id);
      }
    }
  }, [segments]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setIsLoaded(true);
      video.pause();
      video.preload = "auto";
      video.controls = false;
      video.playbackRate = 0;

      // Start at 0 seconds with no button selected
      currentTime.current = 0;
      targetTime.current = 0;
      video.currentTime = 0;
      setActiveSegment(null); // No button selected initially

      // Preload key frames after a short delay
      setTimeout(() => {
        preloadKeyFrames();
      }, 1000);

      // Request video frame callback for smoother updates
      if ("requestVideoFrameCallback" in video) {
        const onFrame = () => {
          if (isAnimating.current || isEasing.current) {
            (video as any).requestVideoFrameCallback(onFrame);
          }
        };
        (video as any).requestVideoFrameCallback(onFrame);
      }
    };

    const handleError = () => {
      setError("Failed to load video. Please check the file path.");
    };

    const handleSeeking = () => {
      video.pause();
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("error", handleError);
    video.addEventListener("seeking", handleSeeking);
    video.addEventListener("seeked", handleSeeking);

    if (video.readyState >= 1) {
      handleLoadedMetadata();
    }

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("error", handleError);
      video.removeEventListener("seeking", handleSeeking);
      video.removeEventListener("seeked", handleSeeking);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };
  }, [segments]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-red-500 p-4 border border-red-300 rounded bg-white">
            {error}
          </div>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            src={videoSrc}
            className="w-full h-full object-cover"
            muted
            playsInline
            preload="auto"
            style={{
              WebkitTransform: "translateZ(0)",
              transform: "translateZ(0)",
              willChange: "transform",
            }}
          />
          
          {/* Navigation Buttons - Positioned like the mockup */}
          {isLoaded && (
            <div className="absolute bottom-0 left-0 right-0 z-10">
              {/* Background bar for buttons */}
              <div className="bg-gradient-to-t from-black/80 via-black/60 to-transparent h-32 flex items-end">
                <div className="w-full flex justify-center pb-8">
                  <div className="flex gap-8">
                    {/* Left Record Button */}
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => navigateToSegment(segments[0])}
                        disabled={isTransitioning && activeSegment === segments[0].id}
                        className={`
                          relative px-8 py-4 text-xs font-bold tracking-widest
                          transition-all duration-300 ease-out
                          border backdrop-blur-sm
                          ${activeSegment === segments[0].id 
                            ? 'bg-amber-500/30 border-amber-400/80 text-amber-100 shadow-lg shadow-amber-500/20' 
                            : 'bg-stone-800/40 border-stone-400/60 text-stone-200 hover:bg-stone-700/50 hover:border-stone-300'
                          }
                          ${isTransitioning && activeSegment === segments[0].id ? 'cursor-wait' : 'cursor-pointer'}
                          rounded-none uppercase
                          hover:shadow-lg hover:shadow-white/10
                          active:scale-95
                          disabled:opacity-90
                        `}
                        style={{
                          textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                          fontFamily: 'monospace',
                          letterSpacing: '0.2em'
                        }}
                      >
                        <div className="relative z-10">
                          LEFT RECORD
                        </div>
                        
                        {/* LED-style indicator */}
                        {activeSegment === segments[0].id && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse shadow-lg shadow-amber-400/50" />
                        )}
                      </button>
                    </div>

                    {/* Control Panel Button */}
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => navigateToSegment(segments[1])}
                        disabled={isTransitioning && activeSegment === segments[1].id}
                        className={`
                          relative px-8 py-4 text-xs font-bold tracking-widest
                          transition-all duration-300 ease-out
                          border backdrop-blur-sm
                          ${activeSegment === segments[1].id 
                            ? 'bg-amber-500/30 border-amber-400/80 text-amber-100 shadow-lg shadow-amber-500/20' 
                            : 'bg-stone-800/40 border-stone-400/60 text-stone-200 hover:bg-stone-700/50 hover:border-stone-300'
                          }
                          ${isTransitioning && activeSegment === segments[1].id ? 'cursor-wait' : 'cursor-pointer'}
                          rounded-none uppercase
                          hover:shadow-lg hover:shadow-white/10
                          active:scale-95
                          disabled:opacity-90
                        `}
                        style={{
                          textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                          fontFamily: 'monospace',
                          letterSpacing: '0.2em'
                        }}
                      >
                        <div className="relative z-10">
                          CONTROL PANEL
                        </div>
                        
                        {/* LED-style indicator */}
                        {activeSegment === segments[1].id && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse shadow-lg shadow-amber-400/50" />
                        )}
                      </button>
                    </div>

                    {/* Right Record Button */}
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => navigateToSegment(segments[2])}
                        disabled={isTransitioning && activeSegment === segments[2].id}
                        className={`
                          relative px-8 py-4 text-xs font-bold tracking-widest
                          transition-all duration-300 ease-out
                          border backdrop-blur-sm
                          ${activeSegment === segments[2].id 
                            ? 'bg-amber-500/30 border-amber-400/80 text-amber-100 shadow-lg shadow-amber-500/20' 
                            : 'bg-stone-800/40 border-stone-400/60 text-stone-200 hover:bg-stone-700/50 hover:border-stone-300'
                          }
                          ${isTransitioning && activeSegment === segments[2].id ? 'cursor-wait' : 'cursor-pointer'}
                          rounded-none uppercase
                          hover:shadow-lg hover:shadow-white/10
                          active:scale-95
                          disabled:opacity-90
                        `}
                        style={{
                          textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                          fontFamily: 'monospace',
                          letterSpacing: '0.2em'
                        }}
                      >
                        <div className="relative z-10">
                          RIGHT RECORD
                        </div>
                        
                        {/* LED-style indicator */}
                        {activeSegment === segments[2].id && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse shadow-lg shadow-amber-400/50" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transition feedback overlay */}
          {isTransitioning && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
              <div className="flex items-center justify-center w-16 h-16">
                <div 
                  className="w-12 h-12 border-2 border-white/30 rounded-full"
                  style={{
                    borderTopColor: 'white',
                    animation: 'spin 1s linear infinite'
                  }}
                />
              </div>
            </div>
          )}

          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="text-white text-lg">Loading video...</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface VideoScrubberOptimizedProps {
  videoSrc: string;
  mode?: "scroll" | "mouse" | "both";
  smoothing?: number;
}

export default function VideoScrubberOptimized({
  videoSrc,
  mode = "both",
  smoothing = 0.1,
}: VideoScrubberOptimizedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animation state
  const targetTime = useRef(0);
  const currentTime = useRef(0);
  const rafId = useRef<number | null>(null);
  const isAnimating = useRef(false);
  const lastFrameTime = useRef(0);

  // Keyframe optimization
  const lastRenderedTime = useRef(-1);
  const frameThreshold = 1 / 30; // Don't update more than 30fps

  const animate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration) {
      rafId.current = requestAnimationFrame(animate);
      return;
    }

    // Calculate time difference
    const timeDiff = Math.abs(targetTime.current - currentTime.current);

    // Stop animating if we're close enough
    if (timeDiff < 0.001) {
      isAnimating.current = false;
      currentTime.current = targetTime.current;
      video.currentTime = video.duration * currentTime.current;
      return;
    }

    // Smooth interpolation
    currentTime.current +=
      (targetTime.current - currentTime.current) * smoothing;

    // Calculate actual video time
    const newVideoTime = video.duration * currentTime.current;

    // Only update if change is significant (reduces jerkiness)
    const timeSinceLastRender = Math.abs(
      newVideoTime - lastRenderedTime.current
    );
    if (timeSinceLastRender > frameThreshold) {
      // Round to nearest frame for smoother playback
      const fps = 30; // Assume 30fps video
      const frameTime = 1 / fps;
      const roundedTime = Math.round(newVideoTime / frameTime) * frameTime;

      video.currentTime = roundedTime;
      lastRenderedTime.current = roundedTime;
    }

    // Continue animation
    if (isAnimating.current) {
      rafId.current = requestAnimationFrame(animate);
    }
  }, [smoothing]);

  const startAnimation = useCallback(() => {
    if (!isAnimating.current) {
      isAnimating.current = true;
      animate();
    }
  }, [animate]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setIsLoaded(true);
      video.pause();

      // Preload video frames
      video.preload = "auto";

      // Disable video controls that might interfere
      video.controls = false;

      // Set playback rate to 0 to prevent any automatic playback
      video.playbackRate = 0;

      // Request video frame callback for smoother updates (Chrome/Edge only)
      if ("requestVideoFrameCallback" in video) {
        const onFrame = () => {
          if (isAnimating.current) {
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
      // Prevent default seeking behavior
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
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (mode === "scroll" || mode === "both") {
      let ticking = false;

      const handleScroll = () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            if (!video.duration) return;

            const scrollTop = window.pageYOffset;
            const docHeight =
              document.documentElement.scrollHeight - window.innerHeight;
            const scrollProgress = Math.min(scrollTop / docHeight, 1);

            targetTime.current = scrollProgress;
            startAnimation();

            ticking = false;
          });
          ticking = true;
        }
      };

      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [mode, startAnimation]);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    if (mode === "mouse" || mode === "both") {
      let rafMouseId: number | null = null;

      const handleMouseMove = (e: MouseEvent) => {
        if (rafMouseId) return;

        rafMouseId = requestAnimationFrame(() => {
          if (!video.duration) return;

          const rect = container.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const progress = Math.max(0, Math.min(1, x / rect.width));

          targetTime.current = progress;
          startAnimation();

          rafMouseId = null;
        });
      };

      container.addEventListener("mousemove", handleMouseMove);
      return () => {
        container.removeEventListener("mousemove", handleMouseMove);
        if (rafMouseId) cancelAnimationFrame(rafMouseId);
      };
    }
  }, [mode, startAnimation]);

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
            // Disable browser optimizations that might cause jerkiness
            style={{
              WebkitTransform: "translateZ(0)",
              transform: "translateZ(0)",
              willChange: "transform",
            }}
          />
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="text-white">Loading video...</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

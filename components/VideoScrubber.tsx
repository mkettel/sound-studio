'use client'

import { useEffect, useRef, useState } from 'react'

interface VideoScrubberProps {
  videoSrc: string
  mode?: 'scroll' | 'mouse' | 'both'
  smoothing?: number
}

export default function VideoScrubber({ videoSrc, mode = 'both', smoothing = 0.1 }: VideoScrubberProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Smooth animation refs
  const targetTime = useRef(0)
  const currentTime = useRef(0)
  const rafId = useRef<number | null>(null)

  // Smooth animation function
  const animate = () => {
    const video = videoRef.current
    if (!video || !video.duration) return
    
    // Smooth interpolation with easing
    currentTime.current += (targetTime.current - currentTime.current) * smoothing
    
    // Update video time
    video.currentTime = currentTime.current
    
    // Continue animation
    rafId.current = requestAnimationFrame(animate)
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      setIsLoaded(true)
      video.pause()
      // Start animation loop only if not already running
      if (!rafId.current) {
        animate()
      }
    }

    const handleError = () => {
      setError('Failed to load video. Please check the file path.')
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('error', handleError)
    
    // If video is already loaded, start immediately
    if (video.readyState >= 1) {
      handleLoadedMetadata()
    }
    
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('error', handleError)
      if (rafId.current) {
        cancelAnimationFrame(rafId.current)
        rafId.current = null
      }
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (mode === 'scroll' || mode === 'both') {
      const handleScroll = () => {
        if (!video.duration) return
        
        const scrollTop = window.pageYOffset
        const docHeight = document.documentElement.scrollHeight - window.innerHeight
        const scrollProgress = Math.min(scrollTop / docHeight, 1)
        
        // Set target time instead of directly updating
        targetTime.current = video.duration * scrollProgress
      }

      window.addEventListener('scroll', handleScroll)
      return () => window.removeEventListener('scroll', handleScroll)
    }
  }, [mode])

  useEffect(() => {
    const video = videoRef.current
    const container = containerRef.current
    if (!video || !container) return

    if (mode === 'mouse' || mode === 'both') {
      const handleMouseMove = (e: MouseEvent) => {
        if (!video.duration) return
        
        const rect = container.getBoundingClientRect()
        const x = e.clientX - rect.left
        const progress = Math.max(0, Math.min(1, x / rect.width))
        
        // Set target time instead of directly updating
        targetTime.current = video.duration * progress
      }

      container.addEventListener('mousemove', handleMouseMove)
      return () => container.removeEventListener('mousemove', handleMouseMove)
    }
  }, [mode])

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
          />
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="text-white">Loading video...</div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
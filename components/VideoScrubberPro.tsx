'use client'

import { useEffect, useRef, useState } from 'react'
import { smoothDamp } from '@/utils/smoothing'

interface VideoScrubberProProps {
  videoSrc: string
  mode?: 'scroll' | 'mouse' | 'both'
  smoothingMethod?: 'lerp' | 'spring' | 'smoothDamp'
  smoothingFactor?: number
}

export default function VideoScrubberPro({ 
  videoSrc, 
  mode = 'both',
  smoothingMethod = 'smoothDamp',
  smoothingFactor = 0.1
}: VideoScrubberProProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Animation state
  const targetProgress = useRef(0)
  const currentProgress = useRef(0)
  const velocity = useRef({ value: 0 })
  const rafId = useRef<number | null>(null)
  const lastTime = useRef(performance.now())
  
  // Spring physics state
  const springVelocity = useRef(0)

  const animate = () => {
    const video = videoRef.current
    if (!video || !video.duration) return
    
    const now = performance.now()
    const deltaTime = Math.min((now - lastTime.current) / 1000, 1/30) // Cap at 30fps min
    lastTime.current = now
    
    // Apply different smoothing methods
    switch (smoothingMethod) {
      case 'lerp':
        // Simple exponential smoothing
        currentProgress.current += (targetProgress.current - currentProgress.current) * smoothingFactor
        break
        
      case 'spring':
        // Spring physics
        const displacement = targetProgress.current - currentProgress.current
        const springForce = displacement * 170 // stiffness
        const dampingForce = springVelocity.current * 26 // damping
        const acceleration = (springForce - dampingForce) * deltaTime
        springVelocity.current += acceleration
        currentProgress.current += springVelocity.current * deltaTime
        break
        
      case 'smoothDamp':
        // Unity-style smooth damp
        currentProgress.current = smoothDamp(
          currentProgress.current,
          targetProgress.current,
          velocity.current,
          smoothingFactor,
          Infinity,
          deltaTime
        )
        break
    }
    
    // Update video time
    video.currentTime = video.duration * currentProgress.current
    
    // Continue animation
    rafId.current = requestAnimationFrame(animate)
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      setIsLoaded(true)
      video.pause()
      if (!rafId.current) {
        lastTime.current = performance.now()
        animate()
      }
    }

    const handleError = () => {
      setError('Failed to load video. Please check the file path.')
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('error', handleError)
    
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
        const scrollProgress = Math.min(Math.max(scrollTop / docHeight, 0), 1)
        
        targetProgress.current = scrollProgress
      }

      // Use passive listener for better performance
      window.addEventListener('scroll', handleScroll, { passive: true })
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
        
        targetProgress.current = progress
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
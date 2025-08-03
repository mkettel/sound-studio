/**
 * Webflow Video Scrubber
 * Smooth scroll and mouse-controlled video playback
 * Usage: Add this script to your Webflow project and follow the HTML structure below
 */

class WebflowVideoScrubber {
  constructor(options = {}) {
    this.videoSelector = options.videoSelector || '[data-video-scrubber]';
    this.containerSelector = options.containerSelector || '[data-video-container]';
    this.mode = options.mode || 'both'; // 'scroll', 'mouse', or 'both'
    this.smoothing = options.smoothing || 0.1;
    
    // Animation state
    this.targetTime = 0;
    this.currentTime = 0;
    this.rafId = null;
    this.isAnimating = false;
    this.lastRenderedTime = -1;
    this.frameThreshold = 1/30; // 30fps max
    
    this.init();
  }
  
  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }
  
  setup() {
    this.video = document.querySelector(this.videoSelector);
    this.container = document.querySelector(this.containerSelector) || this.video?.parentElement;
    
    if (!this.video) {
      console.error('Video element not found. Add data-video-scrubber attribute to your video.');
      return;
    }
    
    this.setupVideo();
    this.bindEvents();
  }
  
  setupVideo() {
    // Configure video for scrubbing
    this.video.muted = true;
    this.video.playsInline = true;
    this.video.preload = 'auto';
    this.video.controls = false;
    
    // Add CSS for smooth rendering
    this.video.style.transform = 'translateZ(0)';
    this.video.style.willChange = 'transform';
    
    // Wait for video to load
    if (this.video.readyState >= 1) {
      this.onVideoLoaded();
    } else {
      this.video.addEventListener('loadedmetadata', () => this.onVideoLoaded());
    }
    
    // Prevent default video behavior
    this.video.addEventListener('seeking', () => this.video.pause());
    this.video.addEventListener('seeked', () => this.video.pause());
  }
  
  onVideoLoaded() {
    this.video.pause();
    this.video.playbackRate = 0;
    
    // Start animation loop
    this.startAnimation();
    
    // Chrome/Edge optimization
    if ('requestVideoFrameCallback' in this.video) {
      const onFrame = () => {
        if (this.isAnimating) {
          this.video.requestVideoFrameCallback(onFrame);
        }
      };
      this.video.requestVideoFrameCallback(onFrame);
    }
  }
  
  bindEvents() {
    if (this.mode === 'scroll' || this.mode === 'both') {
      this.bindScrollEvents();
    }
    
    if (this.mode === 'mouse' || this.mode === 'both') {
      this.bindMouseEvents();
    }
  }
  
  bindScrollEvents() {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (!this.video.duration) return;
          
          const scrollTop = window.pageYOffset;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          const scrollProgress = Math.min(scrollTop / docHeight, 1);
          
          this.targetTime = scrollProgress;
          this.startAnimation();
          
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
  }
  
  bindMouseEvents() {
    if (!this.container) return;
    
    let rafMouseId = null;
    
    const handleMouseMove = (e) => {
      if (rafMouseId) return;
      
      rafMouseId = requestAnimationFrame(() => {
        if (!this.video.duration) return;
        
        const rect = this.container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const progress = Math.max(0, Math.min(1, x / rect.width));
        
        this.targetTime = progress;
        this.startAnimation();
        
        rafMouseId = null;
      });
    };
    
    this.container.addEventListener('mousemove', handleMouseMove);
  }
  
  animate() {
    if (!this.video || !this.video.duration) {
      this.rafId = requestAnimationFrame(() => this.animate());
      return;
    }
    
    // Calculate time difference
    const timeDiff = Math.abs(this.targetTime - this.currentTime);
    
    // Stop animating if close enough
    if (timeDiff < 0.001) {
      this.isAnimating = false;
      this.currentTime = this.targetTime;
      this.video.currentTime = this.video.duration * this.currentTime;
      return;
    }
    
    // Smooth interpolation
    this.currentTime += (this.targetTime - this.currentTime) * this.smoothing;
    
    // Calculate video time
    const newVideoTime = this.video.duration * this.currentTime;
    
    // Only update if change is significant
    const timeSinceLastRender = Math.abs(newVideoTime - this.lastRenderedTime);
    if (timeSinceLastRender > this.frameThreshold) {
      // Round to nearest frame
      const fps = 30;
      const frameTime = 1 / fps;
      const roundedTime = Math.round(newVideoTime / frameTime) * frameTime;
      
      this.video.currentTime = roundedTime;
      this.lastRenderedTime = roundedTime;
    }
    
    // Continue animation
    if (this.isAnimating) {
      this.rafId = requestAnimationFrame(() => this.animate());
    }
  }
  
  startAnimation() {
    if (!this.isAnimating) {
      this.isAnimating = true;
      this.animate();
    }
  }
  
  // Public methods for dynamic control
  setMode(mode) {
    this.mode = mode;
    // Rebind events if needed
  }
  
  setSmoothing(smoothing) {
    this.smoothing = smoothing;
  }
  
  destroy() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    // Remove event listeners if needed
  }
}

// Auto-initialize when script loads
document.addEventListener('DOMContentLoaded', () => {
  // Check if videos exist
  const videos = document.querySelectorAll('[data-video-scrubber]');
  
  videos.forEach((video, index) => {
    // Get options from data attributes
    const mode = video.dataset.scrubMode || 'both';
    const smoothing = parseFloat(video.dataset.scrubSmoothing) || 0.1;
    
    new WebflowVideoScrubber({
      videoSelector: `[data-video-scrubber]:nth-of-type(${index + 1})`,
      mode,
      smoothing
    });
  });
});

// Also expose class globally for manual initialization
window.WebflowVideoScrubber = WebflowVideoScrubber;
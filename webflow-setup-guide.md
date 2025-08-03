# Webflow Video Scrubber Setup Guide

## Quick Setup (5 minutes)

### 1. Add the Script to Webflow

1. Go to your Webflow project settings
2. Navigate to **Custom Code** → **Footer Code**
3. Add this script tag:

```html
<script src="https://your-domain.com/webflow-video-scrubber.js"></script>
```

*Or copy/paste the entire contents of `webflow-video-scrubber.js` wrapped in `<script>` tags*

### 2. Setup Your HTML Structure

In Webflow Designer:

1. **Add a Video Element**
2. **Set Custom Attributes:**
   - Click the video element
   - In Settings panel → Custom Attributes
   - Add: `data-video-scrubber` (no value needed)

3. **Optional: Configure behavior**
   - `data-scrub-mode="scroll"` - Scroll only
   - `data-scrub-mode="mouse"` - Mouse only  
   - `data-scrub-mode="both"` - Both (default)
   - `data-scrub-smoothing="0.1"` - Smoothing factor (0.02-0.3)

### 3. Style Your Video

Make the video fullscreen or however you want:

```css
/* Add in Webflow's custom CSS or embed */
[data-video-scrubber] {
  width: 100vw;
  height: 100vh;
  object-fit: cover;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1;
}
```

## Complete Example Structure

```html
<!-- Video Container (optional) -->
<div data-video-container>
  <!-- Your video with scrubber -->
  <video 
    data-video-scrubber
    data-scrub-mode="both"
    data-scrub-smoothing="0.1"
    muted
    playsinline>
    <source src="your-video.mp4" type="video/mp4">
  </video>
</div>

<!-- Page content for scrolling -->
<div style="height: 300vh;">
  <h1>Scroll to see video scrub</h1>
</div>
```

## Advanced Setup

### Multiple Videos
```html
<!-- Video 1 -->
<video data-video-scrubber data-scrub-mode="scroll">
  <source src="video1.mp4">
</video>

<!-- Video 2 -->  
<video data-video-scrubber data-scrub-mode="mouse">
  <source src="video2.mp4">
</video>
```

### Manual Initialization
```javascript
// Custom control
const scrubber = new WebflowVideoScrubber({
  videoSelector: '#my-video',
  mode: 'both',
  smoothing: 0.15
});

// Change settings dynamically
scrubber.setMode('scroll');
scrubber.setSmoothing(0.05);
```

## Video Optimization

For best results, optimize your MP4:

```bash
ffmpeg -i input.mp4 -g 15 -keyint_min 15 -c:v libx264 -preset slow -crf 22 -movflags +faststart optimized.mp4
```

## Hosting Video Files

1. **Webflow Assets** - Upload directly (max 4GB)
2. **External CDN** - AWS S3, Cloudinary, Vimeo
3. **Enable CORS** if hosting elsewhere

## Troubleshooting

- **Video not loading**: Check file path and CORS headers
- **Jerky playback**: Optimize video with frequent keyframes
- **Not working**: Check browser console for errors
- **Performance**: Use smaller video files, lower resolution

## Browser Support

- ✅ Chrome, Edge, Safari, Firefox
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
- ⚠️ Older browsers may not support all optimizations

## Examples in the Wild

- Apple product pages (AirPods, iPhone)
- Tesla Model S configurator  
- Nike product showcases
- Stripe homepage animations

This gives you the same smooth video scrubbing experience as the React version, but works perfectly in Webflow!
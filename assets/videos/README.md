# Kraken Motorsports - Video Assets

This folder contains video content for the website.

## Recommended Videos to Add

### Promo Videos
- `hero-background-loop.mp4` - Animated background for hero section
- `rig-teaser.mp4` - Short teaser/trailer (30-60 seconds)
- `build-progress-timelapse.mp4` - Construction timelapse

### Gameplay Footage
- `gameplay-nurburgring.mp4` - Sample lap at Nürburgring
- `gameplay-montage.mp4` - Action-packed highlights
- `vr-perspective.mp4` - VR headset POV

### Social Media Content
- `instagram-reel-1.mp4` - Vertical format (9:16) for Instagram/TikTok
- `tiktok-clips/` - Short-form content for TikTok

## Video Specifications

- **Format**: MP4 (H.264 codec)
- **Hero Background**: 1920x1080, loopable, no audio, < 5MB
- **Promo Videos**: 1920x1080, high quality, with audio
- **Social Clips**: Platform-specific dimensions
  - Instagram/TikTok: 1080x1920 (9:16 vertical)
  - YouTube: 1920x1080 (16:9)
  - Twitter: 1280x720 (16:9)

## Implementation Tips

### Background Video
Add to hero section in `index.html`:
```html
<video autoplay muted loop playsinline class="hero-video">
  <source src="assets/videos/hero-background-loop.mp4" type="video/mp4">
</video>
```

### Embedded Players
- Use YouTube/Vimeo for longer content
- Keep file sizes optimized (< 10MB for auto-play)
- Provide video controls for accessibility
- Include captions/subtitles when possible

## Current Status

Using CSS animations and gradients as placeholders until video content is available.

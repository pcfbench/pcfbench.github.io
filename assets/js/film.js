// Agent-run film: play muted while it is on screen, pause when it scrolls away.
// A pause from the viewer sticks, and reduced-motion visitors start it themselves.

const video = document.getElementById('film-video');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let viewerPaused = false, autoPausing = false;

video.addEventListener('pause', () => {
  if (autoPausing) autoPausing = false;
  else if (!video.ended) viewerPaused = true;
});
video.addEventListener('play', () => { viewerPaused = false; });

new IntersectionObserver(([e]) => {
  if (e.isIntersecting) {
    if (!reduced && !viewerPaused && !video.ended) video.play().catch(() => {});
  } else if (!video.paused) {
    autoPausing = true;
    video.pause();
  }
}, { threshold: 0.5 }).observe(video);

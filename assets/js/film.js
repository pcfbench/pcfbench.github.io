// Narrated film: browsers only allow sound after a click, so the film starts from its play button
// and then uses the native controls. It pauses when scrolled out of view.

const fig = document.getElementById('film');
const video = document.getElementById('film-video');

fig.querySelector('.film-play').addEventListener('click', () => {
  video.controls = true;
  video.play();
});
video.addEventListener('play', () => fig.classList.add('playing'));

new IntersectionObserver(([e]) => {
  if (!e.isIntersecting && !video.paused) video.pause();
}, { threshold: 0.25 }).observe(video);

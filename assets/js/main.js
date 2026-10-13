// Page chrome: sticky nav, active section link, mobile menu, reveal-on-scroll, figure lightbox.

const nav = document.querySelector('.topnav');
const hero = document.getElementById('top');
new IntersectionObserver(([e]) => nav.classList.toggle('show', !e.isIntersecting), {
  rootMargin: '-90px 0px 0px 0px',
}).observe(hero);

// mobile menu
const menuBtn = document.querySelector('.menu-btn');
const navLinks = document.getElementById('navlinks');
menuBtn.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', String(open));
});
navLinks.addEventListener('click', (e) => {
  if (e.target.closest('a')) {
    navLinks.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
  }
});

// highlight the section currently in view
const linkFor = new Map([...navLinks.querySelectorAll('a')].map((a) => [a.getAttribute('href').slice(1), a]));
const sectionObserver = new IntersectionObserver((entries) => {
  for (const en of entries) {
    if (!en.isIntersecting) continue;
    linkFor.forEach((a) => a.classList.remove('active'));
    linkFor.get(en.target.id)?.classList.add('active');
  }
}, { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('main section[id]').forEach((s) => sectionObserver.observe(s));

// fade sections up as they enter
const revealObserver = new IntersectionObserver((entries, obs) => {
  for (const en of entries) {
    if (en.isIntersecting) {
      en.target.classList.add('in');
      obs.unobserve(en.target);
    }
  }
}, { rootMargin: '0px 0px -8% 0px' });
document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

// click-to-zoom paper figures
const lightbox = document.getElementById('lightbox');
const lightboxImg = lightbox.querySelector('img');
let lastFocus = null;
document.querySelectorAll('figure[data-zoom]').forEach((fig) => {
  fig.tabIndex = 0;
  fig.setAttribute('role', 'button');
  fig.setAttribute('aria-label', 'Enlarge figure');
  const open = () => {
    const img = fig.querySelector('img');
    lastFocus = fig;
    lightboxImg.src = img.currentSrc || img.src;
    lightboxImg.alt = img.alt;
    lightbox.showModal();
  };
  fig.addEventListener('click', open);
  fig.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
  });
});
lightbox.addEventListener('click', () => lightbox.close());
lightbox.addEventListener('close', () => lastFocus?.focus());

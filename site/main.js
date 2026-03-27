const observer = new IntersectionObserver(
  entries => entries.forEach(e => {
    if (e.isIntersecting)
      e.target.classList.add('visible');
  }),
  {
    threshold: 0.12
  }
);

document
  .querySelectorAll('.reveal')
  .forEach(el => observer.observe(el));

const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

const navObserver = new IntersectionObserver(
  entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navLinks.forEach(a => a.style.color = '');
        const active = document.querySelector(`.nav-links a[href="#${e.target.id}"]`);
        if (active)
          active.style.color = 'var(--red)';
      }
    });
  },
  { rootMargin: '-40% 0px -55% 0px' }
);

sections.forEach(s => navObserver.observe(s));

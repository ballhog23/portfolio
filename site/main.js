const observer = new IntersectionObserver(
  entries => entries.forEach(e => {
    if (e.isIntersecting)
      e.target.classList.add('visible');
  }),
  {
    threshold: 0
  }
);

document
  .querySelectorAll('.reveal')
  .forEach(el => observer.observe(el));

const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

function setActive(id) {
  navLinks.forEach(link => link.classList.remove('active'));
  document
    .querySelector(`.nav-links a[href="#${id}"]`)
    ?.classList.add('active');
}

// The observer sends only the sections that changed, so keep every section that is inside the observer window.
const visible = new Set();

const navObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) visible.add(entry.target);
      else visible.delete(entry.target);
    });
    if (!visible.size) return;

    // choose the section closest to top of viewport
    const topSection = [...visible].reduce((closest, section) => {
      const currTop = Math.abs(section.getBoundingClientRect().top);
      const prevTop = Math.abs(closest.getBoundingClientRect().top);
      return currTop < prevTop ? section : closest;
    });

    setActive(topSection.id);
  },
  {
    rootMargin: '-10% 0px -40% 0px',
    threshold: 0
  }
);

sections.forEach(section => navObserver.observe(section));

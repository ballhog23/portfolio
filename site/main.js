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

const navObserver = new IntersectionObserver(
  entries => {
    // get only sections currently inside the observer window
    const visible = entries.filter(entry => entry.isIntersecting);
    if (!visible.length) return;

    // choose the section closest to top of viewport
    const topSection = visible.reduce((closest, entry) => {
      const currTop = Math.abs(entry.target.getBoundingClientRect().top);
      const prevTop = Math.abs(closest.target.getBoundingClientRect().top);
      return currTop < prevTop ? entry : closest;
    });

    setActive(topSection.target.id);
  },
  {
    rootMargin: '-10% 0px -40% 0px',
    threshold: 0.25
  }
);

sections.forEach(section => navObserver.observe(section));

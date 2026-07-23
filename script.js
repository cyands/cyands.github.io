(() => {
  const toggle = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#site-nav');

  if (!toggle || !navigation) return;

  toggle.addEventListener('click', () => {
    const isOpen = navigation.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });
})();

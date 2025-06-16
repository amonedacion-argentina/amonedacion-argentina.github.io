function inicializarToggles() {
  document.querySelectorAll('.toggle-header').forEach(toggle => {
    if (toggle.dataset.toggleInicializado === "true") return;

    const contentId = toggle.getAttribute('aria-controls');
    const content = document.getElementById(contentId);
    const icon = toggle.querySelector('.toggle-icon');
    if (!content || !icon) return;

    // ✅ Sincronizar el estado inicial correctamente
    const expandedInicial = toggle.getAttribute('aria-expanded') === 'true';
    content.classList.toggle('expanded', expandedInicial);
    content.setAttribute('aria-hidden', String(!expandedInicial));
    icon.textContent = expandedInicial ? '▼' : '▶';

    const toggleContent = () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      const nuevoEstado = !expanded;

      toggle.setAttribute('aria-expanded', nuevoEstado);
      content.setAttribute('aria-hidden', String(!nuevoEstado));
      content.classList.toggle('expanded', nuevoEstado);
      icon.textContent = nuevoEstado ? '▼' : '▶';
    };

    toggle.addEventListener('click', toggleContent);
    toggle.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleContent();
      }
    });

    toggle.dataset.toggleInicializado = "true";
  });
}

document.addEventListener("DOMContentLoaded", inicializarToggles);
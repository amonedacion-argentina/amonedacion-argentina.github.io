document.addEventListener("DOMContentLoaded", () => {

  document.querySelectorAll('.toggle-header').forEach(toggle => {
    const contentId = toggle.getAttribute('aria-controls');
    const content = document.getElementById(contentId);
    const icon = toggle.querySelector('.toggle-icon');
  
    function toggleContent() {
      const expanded = toggle.classList.toggle('expanded');
      content.classList.toggle('expanded');
  
      icon.textContent = expanded ? '▼' : '▶';
      toggle.setAttribute('aria-expanded', expanded);
      content.setAttribute('aria-hidden', !expanded);
    }
  
    toggle.addEventListener('click', toggleContent);
  
    toggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleContent();
      }
    });
  });
  
});
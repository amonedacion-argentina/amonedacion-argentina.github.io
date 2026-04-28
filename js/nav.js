document.addEventListener("DOMContentLoaded", () => {
  const navButtons = document.querySelectorAll(".nav-btn:not([data-section='album'])");
  const sections = document.querySelectorAll(".section");
  const albumButton = document.querySelector('.nav-btn[data-section="album"]');

  // Función para activar sección
  const activateSection = (sectionId) => {
    // Activar/desactivar botones
    navButtons.forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-section") === sectionId);
    });
    
    // Mostrar/ocultar secciones
    sections.forEach(sec => {
      sec.classList.toggle("active", sec.id === sectionId);
    });
  };

  // Manejar navegación interna
  navButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const target = btn.getAttribute("data-section");
      
      if(target === "inicio") {
        history.pushState({}, "", "/"); // URL limpia para inicio
      } else {
        history.pushState({}, "", `#${target}`);
      }
      
      activateSection(target);
      window.scrollTo(0, 0);
    });
  });

  // Configurar botón del álbum (redirección externa)
  if(albumButton) {
    albumButton.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "album";
    });
  }

  // Manejar hash al cargar
  const handleHash = () => {
    const hash = window.location.hash.substring(1);
    if(hash && document.getElementById(hash)) {
      activateSection(hash);
    } else {
      activateSection("inicio");
    }
  };

  // Actualiza el año del footer
  const anioFooter = document.getElementById("anio-footer");
  if (anioFooter) {
    anioFooter.textContent = new Date().getFullYear();
  }

  window.addEventListener("popstate", handleHash);
  handleHash();
});
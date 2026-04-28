document.addEventListener("DOMContentLoaded", () => {
  const navButtons = document.querySelectorAll(".nav-btn");
  const currentPath = window.location.pathname;
  const isAlbumPage = currentPath.includes('album.html') || currentPath.includes('album/');

  // Activa estado del botón Álbum
  navButtons.forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-section") === "album");
  });

  // Maneja clics en navegación
  navButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const section = btn.getAttribute("data-section");
      
      if(section !== "album") {
        // Construye URL correcta
        const cleanUrl = `${window.location.origin}/#${section}`;
        
        // Redirección definitiva
        if(isAlbumPage) {
          // Desde página de álbum redirige al index principal
          window.location.href = cleanUrl;
        } else {
          // Para otros casos (no debería ocurrir en album.html)
          history.pushState({}, '', `#${section}`);
          window.dispatchEvent(new Event('hashchange'));
        }
      }
    });
  });

  // Actualiza el año del footer
  const anioFooter = document.getElementById("anio-footer");
  if (anioFooter) {
    anioFooter.textContent = new Date().getFullYear();
  }
});
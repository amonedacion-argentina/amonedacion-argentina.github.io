document.addEventListener("DOMContentLoaded", () => {
  const navButtons = document.querySelectorAll(".nav-btn");
  const currentPath = window.location.pathname;
  const isAlbumPage = currentPath.includes('album.html') || currentPath.includes('album/');

  // Activar estado del botón Álbum
  navButtons.forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-section") === "album");
  });

  // Manejar clics en navegación
  navButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const section = btn.getAttribute("data-section");
      
      if(section !== "album") {
        // Construir URL correcta
        const cleanUrl = `${window.location.origin}/#${section}`;
        
        // Redirección definitiva
        if(isAlbumPage) {
          // Desde página de álbum - redirigir al index principal
          window.location.href = cleanUrl;
        } else {
          // Para otros casos (no debería ocurrir en album.html)
          history.pushState({}, '', `#${section}`);
          window.dispatchEvent(new Event('hashchange'));
        }
      }
    });
  });
});
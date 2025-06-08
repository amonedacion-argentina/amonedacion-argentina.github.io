document.addEventListener("DOMContentLoaded", () => {
  const langSelect = document.getElementById("lang-select");

  // Idiomas soportados (en JSON)
  const supportedLangs = ["en", "es"];

  // Obtiene el idioma inicial
  function getInitialLang() {
    const savedLang = localStorage.getItem("lang");
    if (savedLang && supportedLangs.includes(savedLang)) return savedLang;

    const navLang = navigator.language.slice(0, 2).toLowerCase();
    if (navLang === "es") return "es";
    if (supportedLangs.includes(navLang)) return navLang;
    return "en";
  }

  // Inicializa idioma
  const initialLang = getInitialLang();
  langSelect.value = initialLang;
  loadLanguage(initialLang);

  // Cambio de idioma desde el select
  langSelect.addEventListener("change", () => {
    const lang = langSelect.value;
    localStorage.setItem("lang", lang);
    loadLanguage(lang);
    if (App.estado.nfts) {
      inicializarFiltros();
    }
  });

  // Carga JSON y aplica textos
function loadLanguage(lang) {
    fetch(`i18n/${lang}.json`)
        .then(res => res.json())
        .then(texts => {
            if (!App.estado) App.estado = {}; // Asegura que App.estado exista
            App.estado.i18n = texts; // Guarda las traducciones
            applyTexts(texts);
            if (typeof inicializarFiltros === 'function') {
                inicializarFiltros(); // Reconstruye filtros con el nuevo idioma
            }
        })
        .catch(err => console.error("Error loading language:", err));
}

  // Obtiene el valor de clave anidada tipo "inicio.h1"
  function getNestedValue(obj, key) {
    return key.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);
  }

  // Aplica los textos según data-i18n y actualiza meta tags
  function applyTexts(texts) {
    document.querySelectorAll("[data-i18n]").forEach(elem => {
      const data = elem.getAttribute("data-i18n");
  
      // Atributo con forma [attr]key
      const attrMatch = data.match(/^\[(\w+)\](.+)/);
      if (attrMatch) {
        const attr = attrMatch[1];     // ej: "alt"
        const key = attrMatch[2];      // ej: "whitepaper.imgAlt"
        const value = getNestedValue(texts, key);
        if (value !== undefined && value !== null) {
          elem.setAttribute(attr, value);
        } else {
          elem.removeAttribute(attr); // o deja como está
        }
      } else {
        // Reemplazo de contenido normal
        const value = getNestedValue(texts, data);
        if (value !== undefined && value !== null) {
          elem.innerHTML = value;
        } else {
          elem.textContent = "";
        }
      }
    });
  
    // Meta title y tags
    if (texts.title) document.title = texts.title;
  
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && texts.meta?.description) {
      metaDescription.setAttribute("content", texts.meta.description);
    }
  
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords && texts.meta?.keywords) {
      metaKeywords.setAttribute("content", texts.meta.keywords);
    }
  }

  // Inicializa el MutationObserver para contenido dinámico
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          applyTextsToElement(node, App.estado.i18n || {});
        }
      });
    });
  });

  // Observa el contenedor principal y la sección de estadísticas
  const mainContainer = document.querySelector('main');
  const statsContainer = document.getElementById('estadisticas-container');
  
  if (mainContainer) {
    observer.observe(mainContainer, {
      childList: true,
      subtree: true
    });
  }
  
  if (statsContainer) {
    observer.observe(statsContainer, {
      childList: true,
      subtree: true
    });
  }

  // Función auxiliar para aplicar textos a un elemento específico
  function applyTextsToElement(element, texts) {
    element.querySelectorAll("[data-i18n]").forEach(elem => {
      const data = elem.getAttribute("data-i18n");
      const value = getNestedValue(texts, data);
      if (value !== undefined && value !== null) {
        elem.textContent = value;
      }
    });
  }
});
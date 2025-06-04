document.addEventListener("DOMContentLoaded", () => {
  const langSelect = document.getElementById("lang-select");

  // Idiomas soportados (en JSON)
  const supportedLangs = ["en", "es"];

  // Función para obtener el idioma inicial
  function getInitialLang() {
    const savedLang = localStorage.getItem("lang");
    if (savedLang && supportedLangs.includes(savedLang)) return savedLang;

    const navLang = navigator.language.slice(0, 2).toLowerCase();
    if (navLang === "es") return "es";
    if (supportedLangs.includes(navLang)) return navLang;
    return "en";
  }

  // Inicializamos idioma
  const initialLang = getInitialLang();
  langSelect.value = initialLang;
  loadLanguage(initialLang);

  // Cambiar idioma desde el select
  langSelect.addEventListener("change", () => {
    const lang = langSelect.value;
    localStorage.setItem("lang", lang);
    loadLanguage(lang);
  });

  // Función para cargar JSON y aplicar textos
  function loadLanguage(lang) {
    fetch(`i18n/${lang}.json`)
      .then(res => {
        if (!res.ok) throw new Error(`Error loading i18n/${lang}.json`);
        return res.json();
      })
      .then(texts => applyTexts(texts))
      .catch(err => {
        console.error("Error loading language:", err);
        if (lang !== "en") {
          langSelect.value = "en";
          localStorage.setItem("lang", "en");
          loadLanguage("en");
        }
      });
  }

  // Función para obtener valor de clave anidada tipo "inicio.h1"
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
          elem.removeAttribute(attr); // o dejar como está
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
});
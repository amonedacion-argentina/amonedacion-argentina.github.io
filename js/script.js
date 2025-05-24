document.addEventListener("DOMContentLoaded", () => {
  const langSelect = document.getElementById("lang-select");
  const navButtons = document.querySelectorAll(".nav-btn");
  const sections = document.querySelectorAll(".section");

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
      const key = elem.getAttribute("data-i18n");
      const text = getNestedValue(texts, key);
      if (text !== undefined && text !== null) {
        elem.innerHTML = text;
      } else {
        elem.textContent = "";
      }
    });

    // Actualizar título
    if (texts.title) document.title = texts.title;

    // Actualizar meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && texts.meta && texts.meta.description) {
      metaDescription.setAttribute("content", texts.meta.description);
    }

    // Actualizar meta keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords && texts.meta && texts.meta.keywords) {
      metaKeywords.setAttribute("content", texts.meta.keywords);
    }
  }

  // Navegación entre secciones
  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      navButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const target = btn.getAttribute("data-section");
      sections.forEach(sec => {
        sec.classList.toggle("active", sec.id === target);
      });

      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  if (![...sections].some(s => s.classList.contains("active"))) {
    sections[0].classList.add("active");
    navButtons[0].classList.add("active");
  }
  
});

document.addEventListener("DOMContentLoaded", () => {
  const sections = document.querySelectorAll(".section");
  const navButtons = document.querySelectorAll(".nav-btn");
  const langSelect = document.getElementById("lang-select");

  // Textos en español e inglés
  const texts = {
    es: {
      nav: ["Inicio", "Catálogo de Monedas", "Whitepaper", "Mercados NFT", "Galerías NFT", "Redes Sociales"],
      inicio: {
        h1: "AMONEDACION ARGENTINA",
        p: "Los invitamos a explorar la riqueza histórica y cultural de las monedas argentinas a través de nuestro catálogo de monedas exclusivo, vinculado a una colección de NFTs pensada para coleccionistas, entusiastas e inversores."
      },
      catalogo: {
        h2: "Catálogo de Monedas",
        p: "Nuestro catálogo incluye monedas digitales con alto valor histórico y artístico, cuidadosamente seleccionadas para coleccionistas y entusiastas. Cada moneda representa una pieza cultural y numismática única digitalizada en formato NFT.",
        btn: "Descargar Catálogo (PDF)"
      },
      whitepaper: {
        h2: "Whitepaper (Documento Técnico)",
        p: "Descubre la visión y los detalles técnicos del proyecto AMONEDACION ARGENTINA, incluyendo objetivos, tecnología y beneficios para coleccionistas y la comunidad blockchain.",
        btn: "Descargar Whitepaper (PDF)"
      },
      marketplaces: {
        h2: "Colección NFT en Marketplaces",
      },
      galerias: {
        h2: "Galerías NFT",
        p: "Plataformas especializadas donde se exhiben NFTs de AMONEDACION ARGENTINA, permitiendo que coleccionistas y público conozcan esta colección única."
      },
      redes: {
        h2: "Redes Sociales",
        p: "Conecta con nosotros en nuestras redes oficiales y mantente al día con las novedades."
      },
      footer: {
        p: "© 2025 AMONEDACION ARGENTINA. Todos los derechos reservados."
      }
    },
    en: {
      nav: ["Home", "Coin Catalog", "Whitepaper", "NFT Marketplaces", "NFT Galleries", "Social Networks"],
      inicio: {
        h1: "AMONEDACION ARGENTINA",
        p: "We invite you to explore the historical and cultural richness of Argentine coins through our exclusive coin catalog, linked to an NFT collection designed for collectors, enthusiasts, and investors."
      },
      catalogo: {
        h2: "Coin Catalog",
        p: "Our catalog includes digital coins with high historical and artistic value, carefully selected for collectors and enthusiasts. Each coin represents a unique cultural and numismatic piece digitized as an NFT.",
        btn: "Download Catalog (PDF)"
      },
      whitepaper: {
        h2: "Whitepaper (Technical Document)",
        p: "Discover the vision and technical details of the AMONEDACION ARGENTINA project, including goals, technology, and benefits for collectors and the blockchain community.",
        btn: "Download Whitepaper (PDF)"
      },
      marketplaces: {
        h2: "NFT Collection in Marketplaces",
      },
      galerias: {
        h2: "NFT Galleries",
        p: "Specialized platforms where AMONEDACION ARGENTINA NFTs are exhibited, allowing collectors and the public to discover this unique collection."
      },
      redes: {
        h2: "Social Networks",
        p: "Connect with us on our official networks and stay updated with the news."
      },
      footer: {
        p: "© 2025 AMONEDACION ARGENTINA. All rights reserved."
      }
    }
  };

  function updateTexts(lang) {
    // Navegación
    navButtons.forEach((btn, i) => {
      btn.textContent = texts[lang].nav[i];
    });

    // Secciones
    for (const sec of sections) {
      const id = sec.id;
    
      if (id === "marketplaces") {
        // Solo h2 cambia
        sec.querySelector("h2").textContent = texts[lang][id].h2;
      } else {
        // h1 o h2
        const h1 = sec.querySelector("h1");
        const h2 = sec.querySelector("h2");
        const p = sec.querySelector("p");
        const a = sec.querySelector("a.btn");
    
        if (h1) h1.textContent = texts[lang][id].h1 || "";
        if (h2) h2.textContent = texts[lang][id].h2 || "";
        if (p) p.textContent = texts[lang][id].p || "";
        if (a) a.textContent = texts[lang][id].btn || "";
      }
    }
    //Footer
    const footerP = document.querySelector("footer p");
    if (footerP) {
      footerP.textContent = texts[lang].footer.p;
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

  // Cambio de idioma
  langSelect.addEventListener("change", () => {
    updateTexts(langSelect.value);
  });

  // Inicialización con idioma por defecto EN
  updateTexts("en");
});
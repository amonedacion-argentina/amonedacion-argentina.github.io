async function cargarDatosNFTs() {
    try {
        const response = await fetch('json/nfts.json');
        const datos = await response.json();
        
        App.estado.categorias = procesarCategorias(datos);
        App.estado.nfts = generarListaNFTs(datos);
    } catch (error) {
        throw new Error('Error al cargar datos de NFTs: ' + error.message);
    }
}

function procesarCategorias(datos) {
    const todasEpocas = datos["todas-las-epocas"];
    const idsTodasEpocas = Object.values(todasEpocas).flat();
    
    const categorias = {
        todas: { 
            nombre: "todas-las-epocas", 
            ids: idsTodasEpocas 
        }
    };

    for (const [key, value] of Object.entries(datos)) {
        if (key === "todas-las-epocas") {
            // Procesa las subcategorías de "todas-las-epocas"
            for (const [subKey, subValue] of Object.entries(value)) {
                categorias[subKey] = {
                    ids: subValue,
                    parent: "todas-las-epocas"
                };
            }
            continue;
        }
        
        if (Array.isArray(value)) {
            categorias[key] = {
                ids: value
            };
        } else if (typeof value === 'object' && value !== null) {
            categorias[key] = {
                ids: [],
                tieneSubcategorias: true
            };

            for (const [subKey, subValue] of Object.entries(value)) {
                categorias[subKey] = {
                    ids: subValue,
                    parent: key
                };
                categorias[key].ids.push(...subValue);
            }
        }
    }
    return categorias;
}

function generarListaNFTs(datos) {
    const todasEpocas = datos["todas-las-epocas"];
    const idsExistentes = Object.values(todasEpocas).flat();

    return idsExistentes.map(id => ({
        id: id,
        enPropiedad: false,
        metadata: null,
        cargandoMetadata: false
    }));
}

function inicializarFiltros() {
    const selectCategoria = document.getElementById('filtro-categoria');
    selectCategoria.innerHTML = '';
    
    const i18n = App.estado.i18n || {};
    const catTranslations = i18n.cat || {};

    // Opción "Todas"
    const optionTodas = document.createElement('option');
    optionTodas.value = 'todas';
    optionTodas.textContent = catTranslations['todas-las-epocas'] || 'Todas las Épocas';
    selectCategoria.appendChild(optionTodas);

    // Categorías principales y subcategorías
    Object.entries(App.estado.categorias).forEach(([key, categoria]) => {
        if (key === 'todas') return;
        
        // Categoría principal
        if (!categoria.parent && key !== "todas-las-epocas") {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = i18n.cat?.[key] || key;
            selectCategoria.appendChild(option);
        }
        
        // Subcategorías (incluyendo las de "todas-las-epocas")
        if (categoria.parent) {
            const option = document.createElement('option');
            option.value = key;
            const prefijo = categoria.parent === "todas-las-epocas" ? "├ " : "↳ ";
            option.textContent = prefijo + (i18n.cat?.[key] || key);
            selectCategoria.appendChild(option);
        }
    });
}
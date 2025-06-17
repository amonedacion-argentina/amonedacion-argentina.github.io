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
    const todasEpocas = datos["todasLasEpocas"];
    const idsTodasEpocas = Object.values(todasEpocas).flat();
    
    const categorias = {
        todas: { 
            nombre: "todasLasEpocas", 
            ids: idsTodasEpocas 
        }
    };

    for (const [key, value] of Object.entries(datos)) {
        if (key === "todasLasEpocas") {
            // Procesa las subcategorías de "todasLasEpocas"
            for (const [subKey, subValue] of Object.entries(value)) {
                categorias[subKey] = {
                    ids: subValue,
                    parent: "todasLasEpocas"
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
    const todasEpocas = datos["todasLasEpocas"];
    const idsExistentes = Object.values(todasEpocas).flat();

    return idsExistentes.map(id => ({
        id: id,
        enPropiedad: false,
        metadata: null,
        cargandoMetadata: false
    }));
}

function inicializarFiltros() {
    const i18n = App.estado.i18n || {};
    const catTranslations = i18n.cat || {};
    
    // Filtro por Categoría
    const selectCategoria = document.getElementById('filtro-categoria');
    selectCategoria.innerHTML = '';
    
    // Opción "Todas las Épocas"
    const optionTodasCategorias = document.createElement('option');
    optionTodasCategorias.value = 'todas';
    optionTodasCategorias.textContent = catTranslations['todasLasEpocas'] || 'Todas las Épocas';
    selectCategoria.appendChild(optionTodasCategorias);

    // Categorías principales y subcategorías
    Object.entries(App.estado.categorias).forEach(([key, categoria]) => {
        if (key === 'todas') return;
        
        // Categoría principal
        if (!categoria.parent && key !== "todasLasEpocas") {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = i18n.cat?.[key] || key;
            selectCategoria.appendChild(option);
        }
        
        // Subcategorías (incluyendo las de "todasLasEpocas")
        if (categoria.parent) {
            const option = document.createElement('option');
            option.value = key;
            const prefijo = categoria.parent === "todasLasEpocas" ? "├ " : "↳ ";
            option.textContent = prefijo + (i18n.cat?.[key] || key);
            selectCategoria.appendChild(option);
        }
    });

    // Filtro por Año
    const selectAnio = document.getElementById('filtro-anio');
    Object.keys(App.estado.anios)
    .filter(key => key !== 'todos')
    .sort((a, b) => parseInt(a) - parseInt(b))
    .forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = key;
        selectAnio.appendChild(option);
    });
}
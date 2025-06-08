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
                    //nombre: formatearNombre(subKey),
                    ids: subValue,
                    parent: "todas-las-epocas"
                };
            }
            continue;
        }
        
        if (Array.isArray(value)) {
            categorias[key] = {
                //nombre: formatearNombre(key),
                ids: value
            };
        } else if (typeof value === 'object' && value !== null) {
            categorias[key] = {
                //nombre: formatearNombre(key),
                ids: [],
                tieneSubcategorias: true
            };

            for (const [subKey, subValue] of Object.entries(value)) {
                categorias[subKey] = {
                    //nombre: formatearNombre(subKey),
                    ids: subValue,
                    parent: key
                };
                categorias[key].ids.push(...subValue);
            }
        }
    }
    return categorias;
}
/*
function formatearNombre(str) {
    return str.split('_')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
}
*/
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
    
    // Obtiene traducciones del estado (asumiendo que se cargaron previamente)
    const i18n = App.estado.i18n || {};
    const catTranslations = i18n.cat || {};

    // Opción "todas-las-epocas" con fallback
    const optionTodas = document.createElement('option');
    optionTodas.value = 'todas';
    optionTodas.textContent = catTranslations['todas-las-epocas'] || 'Todas las Épocas';
    optionTodas.selected = true;
    selectCategoria.appendChild(optionTodas);
    
    // Resto del código usa catTranslations[key] || categoria.nombre
    for (const [key, categoria] of Object.entries(App.estado.categorias)) {
        if (categoria.parent === "todas-las-epocas") {
            const subOption = document.createElement('option');
            subOption.value = key;
            subOption.textContent = `├ ${catTranslations[key] || categoria.nombre}`;
            selectCategoria.appendChild(subOption);
        }
    }
    
    // Otras categorías (traducidas)
    for (const [key, categoria] of Object.entries(App.estado.categorias)) {
        if (key === 'todas' || categoria.parent) continue;
        if (key === "todas-las-epocas") continue;
        
        const option = document.createElement('option');
        option.value = key;
        option.textContent = i18n.cat[key] || categoria.nombre; // Traducción o fallback
        selectCategoria.appendChild(option);
        
        if (categoria.tieneSubcategorias) {
            for (const [subKey, subCategoria] of Object.entries(App.estado.categorias)) {
                if (subCategoria.parent === key) {
                    const subOption = document.createElement('option');
                    subOption.value = subKey;
                    subOption.textContent = `├ ${i18n.cat[subKey] || subCategoria.nombre}`;
                    selectCategoria.appendChild(subOption);
                }
            }
        }
    }
}
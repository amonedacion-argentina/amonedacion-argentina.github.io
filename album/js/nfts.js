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
    const todasEpocas = datos["Todas las Épocas"];
    const idsTodasEpocas = Object.values(todasEpocas).flat();
    
    const categorias = {
        todas: { 
            nombre: "Todas las Épocas", 
            ids: idsTodasEpocas 
        }
    };

    for (const [key, value] of Object.entries(datos)) {
        if (key === "Todas las Épocas") {
            // Procesamos las subcategorías de "Todas las Épocas"
            for (const [subKey, subValue] of Object.entries(value)) {
                categorias[subKey] = {
                    nombre: formatearNombre(subKey),
                    ids: subValue,
                    parent: "Todas las Épocas"
                };
            }
            continue;
        }
        
        if (Array.isArray(value)) {
            categorias[key] = {
                nombre: formatearNombre(key),
                ids: value
            };
        } else if (typeof value === 'object' && value !== null) {
            categorias[key] = {
                nombre: formatearNombre(key),
                ids: [],
                tieneSubcategorias: true
            };

            for (const [subKey, subValue] of Object.entries(value)) {
                categorias[subKey] = {
                    nombre: formatearNombre(subKey),
                    ids: subValue,
                    parent: key
                };
                categorias[key].ids.push(...subValue);
            }
        }
    }
    return categorias;
}

function formatearNombre(str) {
    return str.split('_')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
}

function generarListaNFTs(datos) {
    const todasEpocas = datos["Todas las Épocas"];
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
    
    // Opción "Todas las Épocas" como primera y seleccionada por defecto
    const optionTodas = document.createElement('option');
    optionTodas.value = 'todas';
    optionTodas.textContent = 'Todas las Épocas';
    optionTodas.selected = true;
    selectCategoria.appendChild(optionTodas);
    
    // Subcategorías de "Todas las Épocas"
    for (const [key, categoria] of Object.entries(App.estado.categorias)) {
        if (categoria.parent === "Todas las Épocas") {
            const subOption = document.createElement('option');
            subOption.value = key;
            subOption.textContent = `├ ${categoria.nombre}`;
            selectCategoria.appendChild(subOption);
        }
    }
    
    // Otras categorías principales
    for (const [key, categoria] of Object.entries(App.estado.categorias)) {
        if (key === 'todas' || categoria.parent) continue;
        if (key === "Todas las Épocas") continue;
        
        const option = document.createElement('option');
        option.value = key;
        option.textContent = categoria.nombre;
        selectCategoria.appendChild(option);
        
        if (categoria.tieneSubcategorias) {
            for (const [subKey, subCategoria] of Object.entries(App.estado.categorias)) {
                if (subCategoria.parent === key) {
                    const subOption = document.createElement('option');
                    subOption.value = subKey;
                    subOption.textContent = `├ ${subCategoria.nombre}`;
                    selectCategoria.appendChild(subOption);
                }
            }
        }
    }
}
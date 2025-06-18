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
    const catTrad = App.estado.i18n?.cat || {}; // Categorías traducidas
    const atributosTrad = App.estado.i18n?.atributos || {}; // Atributos traducidos
    
    // Filtro por Categoría
    const selectCategoria = document.getElementById('filtro-categoria');
    selectCategoria.innerHTML = '';
    
    // Opción "Todas las Épocas"
    const optionTodasCategorias = document.createElement('option');
    optionTodasCategorias.value = 'todas';
    optionTodasCategorias.textContent = catTrad['todasLasEpocas'] || 'Todas las Épocas';
    selectCategoria.appendChild(optionTodasCategorias);

    // Categorías principales y subcategorías
    Object.entries(App.estado.categorias).forEach(([key, categoria]) => {
        if (key === 'todas') return;
        
        // Categoría principal
        if (!categoria.parent && key !== "todasLasEpocas") {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = catTrad[key] || key;
            selectCategoria.appendChild(option);
        }
        
        // Subcategorías (incluyendo las de "todasLasEpocas")
        if (categoria.parent) {
            const option = document.createElement('option');
            option.value = key;
            const prefijo = categoria.parent === "todasLasEpocas" ? "├ " : "↳ ";
            option.textContent = prefijo + (catTrad[key] || key);
            selectCategoria.appendChild(option);
        }
    });

    // Filtro por Valor
    const selectValor = document.getElementById('filtro-valor');
    selectValor.innerHTML = '';
    
    // Opción "Todos"
    const optionTodosValores = document.createElement('option');
    optionTodosValores.value = 'todos';
    optionTodosValores.textContent = atributosTrad['todos'] || 'Todos';
    selectValor.appendChild(optionTodosValores);

    // Demás opciones
    Object.keys(App.estado.valores)
    .filter(key => key !== 'todos')
    .sort((a, b) => parseInt(a) - parseInt(b))
    .forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = key;
        selectValor.appendChild(option);
    });

    // Filtro por Año
    const selectAnio = document.getElementById('filtro-anio');
    selectAnio.innerHTML = '';
    
    // Opción "Todos"
    const optionTodosAnios = document.createElement('option');
    optionTodosAnios.value = 'todos';
    optionTodosAnios.textContent = atributosTrad['todos'] || 'Todos';
    selectAnio.appendChild(optionTodosAnios);

    // Demás opciones
    Object.keys(App.estado.anios)
    .filter(key => key !== 'todos')
    .sort((a, b) => parseInt(a) - parseInt(b))
    .forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = key;
        selectAnio.appendChild(option);
    });

    // Filtro por Composición
    const selectComposicion = document.getElementById('filtro-composicion');
    selectComposicion.innerHTML = '';
    
    // Opción "Todas"
    const optionTodasComposiciones = document.createElement('option');
    optionTodasComposiciones.value = 'todas';
    optionTodasComposiciones.textContent = atributosTrad['todas'] || 'Todas';
    selectComposicion.appendChild(optionTodasComposiciones);

    // Demás opciones
    Object.keys(App.estado.composiciones)
    .filter(key => key !== 'todas')
    .forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = atributosTrad[key] || key;
        selectComposicion.appendChild(option);
    });

    // Filtro por Canto
    const selectCanto = document.getElementById('filtro-canto');
    selectCanto.innerHTML = '';
    
    // Opción "Todos"
    const optionTodosCantos = document.createElement('option');
    optionTodosCantos.value = 'todos';
    optionTodosCantos.textContent = atributosTrad['todos'] || 'Todos';
    selectCanto.appendChild(optionTodosCantos);

    // Demás opciones
    Object.keys(App.estado.cantos)
    .filter(key => key !== 'todos')
    .forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = atributosTrad[key] || key;
        selectCanto.appendChild(option);
    });

    // Filtro por Ceca
    const selectCeca = document.getElementById('filtro-ceca');
    selectCeca.innerHTML = '';
    
    // Opción "Todas"
    const optionTodasCecas = document.createElement('option');
    optionTodasCecas.value = 'todas';
    optionTodasCecas.textContent = atributosTrad['todas'] || 'Todas';
    selectCeca.appendChild(optionTodasCecas);

    // Demás opciones
    Object.keys(App.estado.cecas)
    .filter(key => key !== 'todas')
    .forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = atributosTrad[key] || key;
        selectCeca.appendChild(option);
    });
}
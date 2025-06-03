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
    const categorias = {
        todas: { nombre: "Todas las categorías", ids: [] },
        quemados: { nombre: "Quemados", ids: datos.burned || [] }
    };

    for (const [key, value] of Object.entries(datos)) {
        if (key === 'total' || key === 'burned') continue;
        
        if (Array.isArray(value)) {
            // Es una categoría simple
            categorias[key] = {
                nombre: key.charAt(0).toUpperCase() + key.slice(1),
                ids: value
            };
        } else if (typeof value === 'object') {
            // Es una categoría con subcategorías (como Próceres)

            // Primero crea la categoría principal
            categorias[key] = {
                nombre: key.charAt(0).toUpperCase() + key.slice(1),
                ids: [],
                tieneSubcategorias: true
            };

            // Luego procesa sus subcategorías
            for (const [subKey, subValue] of Object.entries(value)) {
                const nombre = subKey.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ');
                
                categorias[subKey] = {
                    nombre: nombre,
                    ids: subValue,
                    parent: key
                };
                
                // Agrega los IDs de la subcategoría a la categoría principal
                categorias[key].ids = [...new Set([...categorias[key].ids, ...subValue])];
            }
        }
    }

    // Genera lista de IDs para "Todas"
    categorias.todas.ids = Array.from({length: datos.total}, (_, i) => i + 1)
        .filter(id => !datos.burned.includes(id));

    return categorias;
}

function generarListaNFTs(datos) {
    const nfts = [];
    const idsQuemados = new Set(datos.burned || []);
    
    for (let id = 1; id <= datos.total; id++) {
        if (!idsQuemados.has(id)) {
            nfts.push({
                id: id,
                enPropiedad: false,
                metadata: null,
                cargandoMetadata: false
            });
        }
    }
    
    return nfts;
}

function inicializarFiltros() {
    const selectCategoria = document.getElementById('filtro-categoria');
    selectCategoria.innerHTML = '';
    
    // Agrega opción para todas las categorías
    const optionTodas = document.createElement('option');
    optionTodas.value = 'todas';
    optionTodas.textContent = 'Todas las categorías';
    selectCategoria.appendChild(optionTodas);
    
    // Agrega categorías principales
    for (const [key, categoria] of Object.entries(App.estado.categorias)) {
        if (key === 'todas' || key === 'quemados') continue;
        if (categoria.parent) continue; // Salta subcategorías
        
        // Categoría principal
        const option = document.createElement('option');
        option.value = key;
        option.textContent = categoria.nombre;
        selectCategoria.appendChild(option);
        
        // Si tiene subcategorías, las agrega agrupadas
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
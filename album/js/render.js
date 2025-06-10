async function cargarTodosLosBalances() {
    if (!App.estado.walletConectada) return;

    mostrarLoading(true);

    try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contrato = new ethers.Contract(
            App.config.CONTRATO,
            [
                'function balanceOf(address, uint256) view returns (uint256)',
                'function balanceOfBatch(address[], uint256[]) view returns (uint256[])'
            ],
            signer
        );

        // Prepara arrays para balanceOfBatch
        const allNFTIds = App.estado.nfts.map(nft => nft.id);
        const addresses = Array(allNFTIds.length).fill(App.estado.direccionWallet);

        // Consulta todos los balances en una sola llamada
        const balances = await contrato.balanceOfBatch(addresses, allNFTIds);

        // Actualiza el estado de propiedad de todos los NFTs
        App.estado.nfts.forEach((nft, index) => {
            const balanceValue = balances[index].toNumber();
            nft.enPropiedad = balanceValue > 0;
            nft.cantidad = balanceValue;
        });

        // Guarda en el estado los IDs de NFTs poseídos
        App.estado.nftsPoseidos = allNFTIds.filter((_, index) => balances[index].gt(0));
    } catch (error) {
        console.error('Error al cargar balances de NFTs:', error);
        mostrarError('Error al verificar sus NFTs.');
    } finally {
        mostrarLoading(false);
    }
}

async function cargarNFTsVisibles() {
    const inicio = (App.estado.paginaActual - 1) * App.estado.itemsPorPagina;
    const fin = inicio + App.estado.itemsPorPagina;
    const nftsPagina = App.estado.nftsFiltrados.slice(inicio, fin);

    for (const nft of nftsPagina) {
        if (nft.enPropiedad && !nft.metadata && !nft.cargandoMetadata) {
            const elemento = document.querySelector(`.nft-card[data-id="${nft.id}"]`);
            getMetadaNFT(nft, elemento);
        }
    }
}

function renderizarNFTs() {
    const galeria = document.getElementById('galeria-nfts');
    galeria.innerHTML = '';
    
    // Calcula índices para la paginación
    const inicio = (App.estado.paginaActual - 1) * App.estado.itemsPorPagina;
    const fin = inicio + App.estado.itemsPorPagina;
    const nftsPagina = App.estado.nftsFiltrados.slice(inicio, fin);
    
    // Actualiza texto de paginación
    document.getElementById('pagina-actual').textContent = App.estado.paginaActual;
    
    // Muestra mensaje si no hay resultados
    if (nftsPagina.length === 0) {
        const mensaje = document.createElement('p');
        mensaje.className = 'sin-resultados';
        mensaje.setAttribute('data-i18n', 'sin-resultados');
        mensaje.textContent = App.estado.i18n?.['sin-resultados'] || 'No se encontraron NFTs que coincidan con los filtros aplicados.';
        galeria.appendChild(mensaje);
        return;
    }
    
    // Renderiza cada NFT
    for (const nft of nftsPagina) {
        const nftElement = crearElementoNFT(nft);
        galeria.appendChild(nftElement);
        
        // Carga metadatos si no están en caché
        if (!nft.metadata && !nft.cargandoMetadata) {
            getMetadaNFT(nft, nftElement);
        } else if (nft.metadata) {
            actualizarCardNFT(nft, nftElement);
        }
    }
    
    actualizarEstadisticas();
    actualizarBotonesPaginador();
    cargarNFTsVisibles();
}

function crearElementoNFT(nft) {
    const nftElement = document.createElement('div');
    nftElement.className = 'nft-card';

    const imagenSrc = (App.estado.walletConectada && nft.enPropiedad && nft.metadata && nft.metadata.image)
    ? `img/monedas-propias/${nft.id}.webp`
    : `img/monedas-grises/${nft.id}.webp`;

    nftElement.innerHTML = `
        <div class="nft-imagen-container">
            <img src="${imagenSrc}" alt="NFT ${nft.id}" 
                 class="nft-imagen ${nft.enPropiedad ? 'nft-propio' : ''}">
            ${nft.enPropiedad ? `<div class="nft-cantidad">x${nft.cantidad}</div>` : ''}
            ${nft.cargandoMetadata ? '<div class="spinner pequeno"></div>' : ''}
        </div>
        <h3 class="nft-nombre">Loading...</h3>
        <div class="nft-atributos"></div>
        <div class="nft-plataformas"></div>
    `;

    return nftElement;
}

function actualizarCardNFT(nft, elemento) {
    if (!nft.metadata) return;
    
    try {
        const metadataTraducida = traducirMetadata(nft.metadata, App.estado.idioma);
        const nombre = sanitizarHTML(metadataTraducida.name || `NFT #${nft.id}`);
        elemento.querySelector('.nft-nombre').textContent = nombre;
        
        const atributosContainer = elemento.querySelector('.nft-atributos');
        atributosContainer.innerHTML = '';

        // Verifica que exista un orden definido
        const ordenAtributos = App.config.ordenAtributos || [];
        
        if (Array.isArray(metadataTraducida.attributes)) {
            // Separa atributos ordenados y no ordenados
            const atributosOrdenados = [];
            const atributosNoOrdenados = [];
            
            metadataTraducida.attributes.forEach(attr => {
                if (!attr.trait_type) return;
                
                // Usa el originalTraitType normalizado para el ordenamiento
                const traitTypeParaOrden = attr.originalTraitType || attr.trait_type;
                const index = ordenAtributos.indexOf(traitTypeParaOrden);
                
                if (index >= 0) {
                    atributosOrdenados.push({
                        ...attr,
                        orden: index
                    });
                } else {
                    atributosNoOrdenados.push(attr);
                }
            });
            
            // Ordena y muestra atributos conocidos
            atributosOrdenados.sort((a, b) => a.orden - b.orden)
                .forEach(attr => {
                    mostrarAtributo(attr, atributosContainer);
                });
            
            // Muestra atributos no ordenados
            atributosNoOrdenados.forEach(attr => {
                mostrarAtributo(attr, atributosContainer, 'atributo-no-ordenado');
            });
        }
        
        // Muestra descripción/observaciones al final
        if (metadataTraducida.description) {
            const descElement = document.createElement('div');
            descElement.className = 'nft-atributo observaciones';
            descElement.innerHTML = `
                <span class="atributo-nombre">${App.estado.i18n?.atributos?.OBSERVACIONES}:</span>
                <span class="atributo-valor">${sanitizarHTML(metadataTraducida.description)}</span>
            `;
            atributosContainer.appendChild(descElement);
        }
        
    } catch (error) {
        console.error(`Error al actualizar tarjeta NFT ${nft.id}:`, error);
        mostrarErrorEnTarjeta(elemento, nft.id);
    }
    
    // Muestra enlaces a plataformas
    const plataformasContainer = elemento.querySelector('.nft-plataformas');
    plataformasContainer.innerHTML = '';

    for (const [key, nombre] of Object.entries(App.config.PLATAFORMAS)) {
        const enlace = document.createElement('a');
        
        // Determina la URL de cada plataforma
        let url;
        switch(key) {
            case 'OPENSEA':
                url = `${App.config.OPENSEA_URL}${App.config.CONTRATO}/${nft.id}`;
                break;
            case 'RARIBLE':
                url = `${App.config.RARIBLE_URL}${App.config.CONTRATO}:${nft.id}`;
                break;
            case 'OKX':
                url = `${App.config.OKX_URL}${App.config.CONTRATO}/${nft.id}`;
                break;
            case 'LOOKSRARE':
                url = `${App.config.LOOKSRARE_URL}${App.config.CONTRATO}/${nft.id}`;
                break;
            case 'MAGICEDEN':
                url = `${App.config.MAGICEDEN_URL}${App.config.CONTRATO}/${nft.id}`;
                break;
            default:
                url = '#';
        }
        
        enlace.href = url;
        enlace.target = '_blank';
        enlace.rel = 'noopener noreferrer';
        enlace.title = nombre; // Tooltip al pasar el mouse
        
        // Crea el elemento de imagen
        const img = document.createElement('img');
        img.src = `../img/${key.toLowerCase()}.png`;
        img.alt = nombre;
        
        // Maneja el error si la imagen no carga
        img.onerror = function() {
            this.style.display = 'none';
            enlace.textContent = key.charAt(0); // Muestra inicial si falla la imagen
        };
        
        enlace.appendChild(img);
        plataformasContainer.appendChild(enlace);
    }
}

// Muestra atributos
function mostrarAtributo(attr, container, claseExtra = '') {
    const attrElement = document.createElement('div');
    attrElement.className = `nft-atributo ${claseExtra}`.trim();
    attrElement.innerHTML = `
        <span class="atributo-nombre">${sanitizarHTML(attr.trait_type)}:</span>
        <span class="atributo-valor">${sanitizarHTML(attr.value)}</span>
    `;
    container.appendChild(attrElement);
}

// Muestra errores en la tarjeta
function mostrarErrorEnTarjeta(elemento, nftId) {
    if (!elemento) return;
    
    const errorContainer = elemento.querySelector('.nft-atributos') || elemento;
    errorContainer.innerHTML = `
        <div class="error-atributo">
            Error al cargar los atributos del NFT #${nftId}
        </div>
    `;
}

function actualizarEstadisticas() {
    const container = document.getElementById('estadisticas-container');
    if (!container) return;

    if (!App.estado.walletConectada) {
        container.classList.add('hidden');
        return;
    }
    
    container.classList.remove('hidden');
    
    const {totalNFTs, nftsPropios, categoriasStats} = calcularEstadisticas();
    container.innerHTML = generarHTMLStats(totalNFTs, nftsPropios, categoriasStats);
}

function calcularEstadisticas() {
    const totalNFTs = App.estado.nfts.length;
    const nftsPropios = App.estado.nftsPoseidos?.length || 0;
    
    const categoriasStats = Object.entries(App.estado.categorias)
        .filter(([catKey]) => catKey !== 'todas')
        .map(([catKey, categoria]) => {
            const poseidosEnCategoria = categoria.ids
                .filter(id => App.estado.nftsPoseidos?.includes(id))
                .length;
                
            return {
                nombre: catKey, // Usa la clave para i18n
                total: categoria.ids.length,
                poseidos: poseidosEnCategoria,
                porcentaje: Math.round((poseidosEnCategoria / categoria.ids.length) * 100)
            };
        })
        .sort((a, b) => b.porcentaje - a.porcentaje);

    return {totalNFTs, nftsPropios, categoriasStats};
}

function generarHTMLStats(totalNFTs, nftsPropios, categoriasStats) {
    const i18n = App.estado.i18n || {};
    const porcentajeTotal = Math.round((nftsPropios / totalNFTs) * 100);
    
    const itemsCategorias = categoriasStats.map(cat => {
        const nombreTraducido = i18n.cat?.[cat.nombre] || cat.nombre;
        return `
            <li>
                <span class="categoria-nombre">${nombreTraducido}</span>
                <div class="progreso-categoria">
                    <div class="progreso-barra" style="width: ${cat.porcentaje}%"></div>
                    <span>${cat.poseidos}/${cat.total} (${cat.porcentaje}%)</span>
                </div>
            </li>
        `;
    }).join('');

    return `
        <div class="estadisticas-global">
            <h3>${i18n.stats?.['mi-coleccion'] || 'Mi Colección'}</h3>
            <div class="progreso-total">
                <div class="progreso-barra" style="width: ${porcentajeTotal}%"></div>
                <span>${nftsPropios}/${totalNFTs} NFTs (${porcentajeTotal}%)</span>
            </div>
        </div>
        <div class="estadisticas-categorias">
            <h4>${i18n.stats?.['por-categoria'] || 'Por Categoría:'}</h4>
            <ul class="lista-categorias">
                ${itemsCategorias}
            </ul>
        </div>
    `;
}

let idiomaCambiadoHandler;
document.addEventListener('i18nLoaded', () => {
    // Elimina handler anterior si existe
    if (idiomaCambiadoHandler) {
        document.removeEventListener('idiomaCambiado', idiomaCambiadoHandler);
    }
    
    // Crea nuevo handler
    idiomaCambiadoHandler = () => {
        // Solo actualiza textos, no reinicia filtros
        actualizarEstadisticas();
        
        // Actualiza textos en los NFTs ya renderizados
        document.querySelectorAll('.nft-card').forEach(card => {
            const nftId = card.dataset.id;
            const nft = App.estado.nftsFiltrados.find(n => n.id === nftId);
            if (nft && nft.metadata) {
                actualizarCardNFT(nft, card);
            }
        });
    };
    
    document.addEventListener('idiomaCambiado', idiomaCambiadoHandler);
});

// Traduce metadatos (atributos y descripción del NFT)
function traducirMetadata(nftMetadata, lang = 'es') {
    if (!nftMetadata) return { attributes: [] };
    
    const i18n = App.estado.i18n?.atributos || {};
    
    const normalizarTexto = (text) => {
        if (!text) return '';
        return text.toString().trim().toUpperCase();
    };
    
    return {
        ...nftMetadata,
        attributes: (nftMetadata.attributes || []).map(attr => {
            const traitType = normalizarTexto(attr.trait_type);
            return {
                trait_type: i18n[traitType] || attr.trait_type,
                value: i18n[attr.value] || attr.value,
                originalTraitType: traitType // Guardamos el original normalizado
            };
        }),
        description: nftMetadata.description ? (i18n[nftMetadata.description] || nftMetadata.description) : undefined
    };
}

function actualizarBotonesPaginador() {
    const totalPaginas = Math.ceil(App.estado.nftsFiltrados.length / App.estado.itemsPorPagina);
    
    // Actualiza botones
    document.getElementById('btn-primera').disabled = App.estado.paginaActual <= 1;
    document.getElementById('btn-anterior').disabled = App.estado.paginaActual <= 1;
    document.getElementById('btn-siguiente').disabled = App.estado.paginaActual >= totalPaginas;
    document.getElementById('btn-ultima').disabled = App.estado.paginaActual >= totalPaginas;
    
    // Actualiza información de página
    document.getElementById('pagina-actual').textContent = App.estado.paginaActual;
    document.getElementById('total-paginas').textContent = totalPaginas;
    
    // Actualiza aria-live para lectores de pantalla
    const paginadorInfo = document.querySelector('.paginador-info');
    if (paginadorInfo) {
        paginadorInfo.setAttribute('aria-live', 'polite');
        paginadorInfo.setAttribute('aria-atomic', 'true');
    }
}

function sanitizarHTML(str) {
    if (!str) return '';
    return str.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
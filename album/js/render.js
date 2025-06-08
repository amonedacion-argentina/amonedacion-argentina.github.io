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
        });

        // Guarda en el estado los IDs de NFTs poseídos
        App.estado.nftsPoseidos = allNFTIds.filter((_, index) => balances[index].gt(0));

        actualizarEstadisticas();

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
        galeria.innerHTML = '<p class="sin-resultados" data-i18n="sin-resultados">No se encontraron NFTs que coincidan con los filtros aplicados.</p>';
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
            ${nft.cargandoMetadata ? '<div class="spinner pequeno"></div>' : ''}
        </div>
        <h3 class="nft-nombre" data-i18n="cargando">Cargando...</h3>
        <div class="nft-atributos"></div>
        <div class="nft-plataformas"></div>
    `;

    return nftElement;
}

function actualizarCardNFT(nft, elemento) {
    if (!nft.metadata) return;
    
    // Sanitiza y muestra nombre
    const nombre = sanitizarHTML(nft.metadata.name || `NFT #${nft.id}`);
    elemento.querySelector('.nft-nombre').textContent = nombre;
    
    // Sanitiza y muestra atributos
    const atributosContainer = elemento.querySelector('.nft-atributos');
    atributosContainer.innerHTML = '';
    
    if (nft.metadata.attributes && nft.metadata.attributes.length > 0) {
        nft.metadata.attributes.forEach(attr => {
            const attrElement = document.createElement('div');
            attrElement.className = 'nft-atributo';
            attrElement.innerHTML = `
                <span class="atributo-nombre">${sanitizarHTML(attr.trait_type)}:</span>
                <span class="atributo-valor">${sanitizarHTML(attr.value)}</span>
            `;
            atributosContainer.appendChild(attrElement);
        });
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
            enlace.textContent = key.charAt(0); // Mostrar inicial si falla la imagen
        };
        
        enlace.appendChild(img);
        plataformasContainer.appendChild(enlace);
    }
}

function actualizarEstadisticas() {
    const container = document.getElementById('estadisticas-container');
    if (!container) return;

    // Oculta si no hay wallet conectada
    if (!App.estado.walletConectada) {
        container.classList.add('hidden');
        return;
    }
    
    container.classList.remove('hidden');
    
    // Calcula estadísticas
    const { totalNFTs, nftsPropios, categoriasStats } = calcularEstadisticas();
    
    // Genera y muestra HTML
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
                nombre: categoria.nombre,
                total: categoria.ids.length,
                poseidos: poseidosEnCategoria,
                porcentaje: Math.round((poseidosEnCategoria / categoria.ids.length) * 100)
            };
        })
        .sort((a, b) => b.porcentaje - a.porcentaje);

    return {totalNFTs, nftsPropios, categoriasStats};
}

function generarHTMLStats(totalNFTs, nftsPropios, categoriasStats) {
    const porcentajeTotal = Math.round((nftsPropios / totalNFTs) * 100);

    console.log("categoriasStats: "+categoriasStats);
    
    // Verificar y mapear las categorías de forma segura
    const itemsCategorias = categoriasStats.map(cat => {
        // Validación para evitar undefined
        const nombre = cat?.nombre || 'Categoría desconocida';
        const poseidos = cat?.poseidos || 0;
        const total = cat?.total || 0;
        const porcentaje = cat?.porcentaje || 0;
        
        return `
            <li>
                <span class="categoria-nombre" data-i18n="cat.${nombre}">${nombre}</span>
                <div class="progreso-categoria">
                    <div class="progreso-barra" style="width: ${porcentaje}%"></div>
                    <span>${poseidos}/${total} (${porcentaje}%)</span>
                </div>
            </li>
        `;
    }).join('');

    return `
        <div class="estadisticas-global">
            <h3 data-i18n="stats.mi-coleccion">Mi Colección</h3>
            <div class="progreso-total">
                <div class="progreso-barra" style="width: ${porcentajeTotal}%"></div>
                <span>${nftsPropios}/${totalNFTs} NFTs (${porcentajeTotal}%)</span>
            </div>
        </div>
        <div class="estadisticas-categorias">
            <h4 data-i18n="stats.por-categoria">Por Categoría:</h4>
            <ul class="lista-categorias">
                ${itemsCategorias}
            </ul>
        </div>
    `;
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
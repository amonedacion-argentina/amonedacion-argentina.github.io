function renderizarNFTs() {
    const galeria = document.getElementById('galeria-nfts');
    galeria.innerHTML = '';
    
    // Calcular índices para la paginación
    const inicio = (App.estado.paginaActual - 1) * App.estado.itemsPorPagina;
    const fin = inicio + App.estado.itemsPorPagina;
    const nftsPagina = App.estado.nftsFiltrados.slice(inicio, fin);
    
    // Actualizar texto de paginación
    document.getElementById('pagina-actual').textContent = App.estado.paginaActual;
    
    // Mostrar mensaje si no hay resultados
    if (nftsPagina.length === 0) {
        galeria.innerHTML = '<p class="sin-resultados">No se encontraron NFTs que coincidan con los filtros</p>';
        return;
    }
    
    // Renderizar cada NFT
    for (const nft of nftsPagina) {
        const nftElement = crearElementoNFT(nft);
        galeria.appendChild(nftElement);
        
        // Cargar metadatos si no están en caché
        if (!nft.metadata && !nft.cargandoMetadata) {
            cargarMetadatosNFT(nft, nftElement);
        } else if (nft.metadata) {
            actualizarCardNFT(nft, nftElement);
        }
    }
    
    // Actualizar estado de botones de paginación
    actualizarBotonesPaginacion();
}

function crearElementoNFT(nft) {
    const nftElement = document.createElement('div');
    nftElement.className = 'nft-card';
    nftElement.innerHTML = `
        <div class="nft-imagen-container">
            <img src="img/monedas-grises/${nft.id}.png" alt="NFT ${nft.id}" 
                 class="nft-imagen ${nft.enPropiedad ? 'nft-propio' : ''}">
            ${nft.cargandoMetadata ? '<div class="spinner pequeno"></div>' : ''}
        </div>
        <h3 class="nft-nombre">Cargando...</h3>
        <div class="nft-atributos"></div>
        <div class="nft-plataformas"></div>
    `;
    return nftElement;
}

function actualizarCardNFT(nft, elemento) {
    if (!nft.metadata) return;
    
    // Sanitizar y mostrar nombre
    const nombre = sanitizarHTML(nft.metadata.name || `NFT #${nft.id}`);
    elemento.querySelector('.nft-nombre').textContent = nombre;
    
    // Mostrar atributos
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
    
    // Mostrar enlaces a plataformas
    const plataformasContainer = elemento.querySelector('.nft-plataformas');
    plataformasContainer.innerHTML = '';
    
    for (const [key, nombre] of Object.entries(App.config.PLATAFORMAS)) {
        const enlace = document.createElement('a');
        enlace.href = `${App.config.OPENSEA_URL}${App.config.CONTRATO}/${nft.id}`;
        enlace.target = '_blank';
        enlace.rel = 'noopener noreferrer';
        enlace.textContent = nombre;
        plataformasContainer.appendChild(enlace);
    }
}

function actualizarEstadisticas() {
    if (!App.estado.walletConectada) return;
    
    const totalNFTs = App.estado.nftsFiltrados.length;
    const nftsPropios = App.estado.nftsFiltrados.filter(nft => nft.enPropiedad).length;
    
    document.getElementById('wallet-estadisticas').textContent = 
        `Completado: ${nftsPropios} de ${totalNFTs}`;
}

function actualizarBotonesPaginacion() {
    const totalPaginas = Math.ceil(App.estado.nftsFiltrados.length / App.estado.itemsPorPagina);
    document.getElementById('btn-anterior').disabled = App.estado.paginaActual <= 1;
    document.getElementById('btn-siguiente').disabled = App.estado.paginaActual >= totalPaginas;
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
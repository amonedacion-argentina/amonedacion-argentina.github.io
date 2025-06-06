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

        // Actualiza la UI para mostrar todos los NFTs poseídos
        actualizarUINFTsPoseidos();

        actualizarEstadisticas();

    } catch (error) {
        console.error('Error al cargar balances de NFTs:', error);
        mostrarError('Error al verificar tus NFTs.');
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

// Muestra NFTs poseídos fuera de la página actual
function actualizarUINFTsPoseidos() {
    if (!App.estado.nftsPoseidos || App.estado.nftsPoseidos.length === 0) return;

    const poseidosFueraPagina = App.estado.nftsPoseidos.filter(id => {
        const nft = App.estado.nfts.find(n => n.id === id);
        return nft && !App.estado.nftsFiltrados.slice(
            (App.estado.paginaActual - 1) * App.estado.itemsPorPagina,
            App.estado.paginaActual * App.estado.itemsPorPagina
        ).some(n => n.id === id);
    });

    const contadorElement = document.getElementById('contador-nfts-poseidos');
    if (contadorElement) {
        contadorElement.textContent = `(+${poseidosFueraPagina.length} NFTs poseídos en otras páginas)`;
        contadorElement.style.display = poseidosFueraPagina.length > 0 ? 'block' : 'none';
    }
}

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
        galeria.innerHTML = '<p class="sin-resultados">No se encontraron NFTs que coincidan con los filtros aplicados.</p>';
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

    // Actualiza estado de botones de paginación
    actualizarBotonesPaginacion();

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
        <h3 class="nft-nombre">Cargando...</h3>
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
        enlace.style.display = 'inline-block';
        enlace.style.margin = '0 5px';
        
        // Crea el elemento de imagen
        const img = document.createElement('img');
        img.src = `../img/${key.toLowerCase()}.png`;
        img.alt = nombre;
        img.width = 24; // Tamaño uniforme para todos los iconos
        img.height = 24;
        img.style.verticalAlign = 'middle';
        
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
    if (!App.estado.walletConectada) {
        const container = document.getElementById('estadisticas-container');
        if (container) container.classList.add('hidden');
        return;
    }
    
    const container = document.getElementById('estadisticas-container');
    if (!container) return;
    
    container.classList.remove('hidden');
    
    // Estadísticas generales
    const totalNFTs = App.estado.nfts.length;
    const nftsPropios = App.estado.nftsPoseidos?.length || 0;
    
    // Calcular estadísticas por categoría
    let categoriasStats = {};
    
    for (const [catKey, categoria] of Object.entries(App.estado.categorias)) {
        if (catKey === 'todas' || catKey === 'quemados') continue;
        
        const totalEnCategoria = categoria.ids.length;
        const poseidosEnCategoria = categoria.ids.filter(id => 
            App.estado.nftsPoseidos?.includes(id)
        ).length;
        
        categoriasStats[catKey] = {
            nombre: categoria.nombre,
            total: totalEnCategoria,
            poseidos: poseidosEnCategoria,
            porcentaje: Math.round((poseidosEnCategoria / totalEnCategoria) * 100)
        };
    }
    
    // Ordena categorías por porcentaje completado (descendente)
    const categoriasOrdenadas = Object.values(categoriasStats).sort((a, b) => b.porcentaje - a.porcentaje);
    
    // Genera HTML
    let html = `
        <div class="estadisticas-global">
            <h3>Su Colección</h3>
            <div class="progreso-total">
                <div class="progreso-barra" style="width: ${(nftsPropios / totalNFTs) * 100}%"></div>
                <span>${nftsPropios} de ${totalNFTs} NFTs (${Math.round((nftsPropios / totalNFTs) * 100)}%)</span>
            </div>
        </div>
        
        <div class="estadisticas-categorias">
            <h4>Por Categoría:</h4>
            <ul class="lista-categorias">
    `;
    
    categoriasOrdenadas.forEach(cat => {
        html += `
            <li>
                <span class="categoria-nombre">${cat.nombre}</span>
                <div class="progreso-categoria">
                    <div class="progreso-barra" style="width: ${cat.porcentaje}%"></div>
                    <span>${cat.poseidos}/${cat.total} (${cat.porcentaje}%)</span>
                </div>
            </li>
        `;
    });
    
    html += `
            </ul>
        </div>
    `;
    
    container.innerHTML = html;
}

function actualizarBotonesPaginacion() {
    const totalPaginas = Math.ceil(App.estado.nftsFiltrados.length / App.estado.itemsPorPagina);
    
    // Actualizar botones
    document.getElementById('btn-primera').disabled = App.estado.paginaActual <= 1;
    document.getElementById('btn-anterior').disabled = App.estado.paginaActual <= 1;
    document.getElementById('btn-siguiente').disabled = App.estado.paginaActual >= totalPaginas;
    document.getElementById('btn-ultima').disabled = App.estado.paginaActual >= totalPaginas;
    
    // Actualizar información de página
    document.getElementById('pagina-actual').textContent = App.estado.paginaActual;
    document.getElementById('total-paginas').textContent = totalPaginas;
    
    // Actualizar aria-live para lectores de pantalla
    const paginacionInfo = document.querySelector('.paginacion-info');
    if (paginacionInfo) {
        paginacionInfo.setAttribute('aria-live', 'polite');
        paginacionInfo.setAttribute('aria-atomic', 'true');
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
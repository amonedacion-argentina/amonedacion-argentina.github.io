async function cargarTodosLosBalances() {
    if (!App.estado.walletConectada) {
        console.log('Wallet no conectada, omitiendo carga de balances');
        mostrarLoading(false);
        return;
    }

    mostrarLoading(true);

    try {
        //Configura provider y contrato
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contrato = new ethers.Contract(
            App.config.CONTRATO,
            [
                'function owner() view returns (address)',
                'function balanceOf(address, uint256) view returns (uint256)',
                'function balanceOfBatch(address[], uint256[]) view returns (uint256[])'
            ],
            signer
        );

        App.estado.owner = await contrato.owner();
        const allNFTIds = App.estado.nfts.map(nft => nft.id);
        const addresses = Array(allNFTIds.length).fill(App.estado.direccionWallet);
        const balances = await contrato.balanceOfBatch(addresses, allNFTIds);

        // Actualiza estado
        App.estado.nfts.forEach((nft, index) => {
            const balanceValue = balances[index].toNumber();
            nft.enPropiedad = balanceValue > 0;
            nft.cantidad = balanceValue;
        });

        App.estado.nftsPoseidos = allNFTIds.filter((_, index) => balances[index].gt(0));

        // Precarga metadatos para NFTs propios
        const nftsPropios = App.estado.nfts.filter(nft => nft.enPropiedad);
        
        await Promise.all(nftsPropios.map(nft => {
            if (!nft.metadata && !nft.cargandoMetadata) {
                return getMetadaNFT(nft);
            }
            return Promise.resolve();
        }));

        // Actualiza UI
        await aplicarFiltro();

    } catch (error) {
        console.error('Error en cargarTodosLosBalances: ', error);
        mostrarError(App.estado.i18n?.error?.verificarNfts || 'Error al verificar sus NFTs.');
        
        // Verifica específicamente si es error de red
        if (error.message.includes('chain') || error.message.includes('red')) {
            console.error('Error de red detectado: ', error);
            mostrarError('Por favor verifica que estás en la red Ethereum Mainnet');
        }
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

async function renderizarNFTs() {
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
        mensaje.setAttribute('data-i18n', 'sinResultados');
        mensaje.textContent = App.estado.i18n?.['sinResultados'] || 'No se encontraron NFTs que coincidan con los filtros aplicados.';
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
    
    // Fuerza carga de imágenes
    await new Promise(resolve => setTimeout(resolve, 50));

    actualizarEstadisticas();
    actualizarBotonesPaginador();
    await cargarNFTsVisibles();
}

function crearElementoNFT(nft) {
    const i18n = App.estado.i18n || {};
    const nftElement = document.createElement('div');
    nftElement.className = 'nft-card';

    const imagenSrc = (App.estado.walletConectada && nft.enPropiedad && nft.metadata && nft.metadata.image)
    ? `img/monedas-propias/${nft.id}.webp`
    : `img/monedas-grises/${nft.id}.webp`;

    nftElement.innerHTML = `
        <div class="nft-imagen-container ${nft.enPropiedad ? 'propio' : 'no-propio'}">
            <img src="${imagenSrc}" loading="lazy" decoding="async" alt="NFT ${nft.id}" class="nft-imagen ${nft.enPropiedad ? 'nft-propio' : ''}">
            ${nft.enPropiedad ? `<div class="nft-cantidad">x${nft.cantidad}</div>
                                <div class="div-transferir" onclick="abrirPopupTransferencia(${nft.id})" title="${i18n.transferencia?.transferir || 'Transferir'}">
                                    <img src="img/transferir.png" alt="${i18n.transferencia?.transferir || 'Transferir'}">
                                </div>` : ''}
            ${nft.cargandoMetadata ? '<div class="spinner pequeno"></div>' : ''}
        </div>
        <h3 class="nft-nombre">${i18n.cargando || 'Cargando...'}</h3>
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
            //case 'MAGICEDEN':
            //    url = `${App.config.MAGICEDEN_URL}${App.config.CONTRATO}/${nft.id}`;
            //    break;
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
            ${App.estado.i18n?.error?.cargaAtributos}${nftId}
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
    
    const {totalNFTs, nftsPropios, categoriasStats, listaRarezas} = calcularEstadisticas();
    container.innerHTML = generarHTMLStats(totalNFTs, nftsPropios, categoriasStats, listaRarezas);
    inicializarToggles();
}

function ordenRareza(nombre) {
  const orden = { R1: 1, R2: 2, R3: 3, R4: 4, R5: 5 };
  return orden[nombre] || 999; // Desconocidas al final
}

function calcularEstadisticas() {
    const totalNFTs = App.estado.nfts.length;
    const nftsPropios = App.estado.nftsPoseidos?.length || 0;
    
    // Por Categoría
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

    // Por Rareza
    const rarezasStats = {};

    App.estado.nfts.forEach(nft => {
        if (!nft.metadata || !Array.isArray(nft.metadata.attributes)) return;

        const rarezaAttr = nft.metadata.attributes.find(attr =>
            (attr.trait_type || '').toUpperCase() === 'RAREZA'
        );

        if (!rarezaAttr) return;

        const clave = (rarezaAttr.value || 'Desconocida').toUpperCase();

        if (!rarezasStats[clave]) {
            rarezasStats[clave] = { total: 0, poseidos: 0 };
        }

        rarezasStats[clave].total += 1;
        if (nft.enPropiedad) {
            rarezasStats[clave].poseidos += 1;
        }
    });

    const listaRarezas = Object.entries(rarezasStats).map(([nombre, datos]) => ({
        nombre,
        total: datos.total,
        poseidos: datos.poseidos,
        porcentaje: Math.round((datos.poseidos / datos.total) * 100)
    })).sort((a, b) => {
        if (b.porcentaje !== a.porcentaje) {
            return b.porcentaje - a.porcentaje;
        }
        return ordenRareza(a.nombre) - ordenRareza(b.nombre);
    });

    return {totalNFTs, nftsPropios, categoriasStats, listaRarezas };
}

function generarHTMLStats(totalNFTs, nftsPropios, categoriasStats, listaRarezas = []) {
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

    const itemsRarezas = listaRarezas.map(r => {
        const nombreTraducido = i18n.filtros?.[r.nombre.toLowerCase()] || r.nombre;
        return `
            <li>
                <span class="categoria-nombre">${nombreTraducido}</span>
                <div class="progreso-categoria">
                    <div class="progreso-barra" style="width: ${r.porcentaje}%"></div>
                    <span>${r.poseidos}/${r.total} (${r.porcentaje}%)</span>
                </div>
            </li>
        `;
    }).join('');

    return `
        <div id="estadisticas-global">
            <div class="toggle-header" role="button" tabindex="0" aria-expanded="true" aria-controls="contenido-global">
                <h4>${i18n.estadisticas?.['miColeccion'] || 'Mi Colección'}</h4>
                <span class="toggle-icon">▶</span>
            </div>
            <div id="contenido-global" class="toggle-content expanded" aria-hidden="false">
                <h4 class="categoria-nombre">${i18n.estadisticas?.['progresoTotal'] || 'Progreso Total'}</h4>
                <div class="progreso-total">
                    <div class="progreso-barra" style="width: ${porcentajeTotal}%"></div>
                    <span>${nftsPropios}/${totalNFTs} NFTs (${porcentajeTotal}%)</span>
                </div>

                <div id="estadisticas-categorias">
                    <div class="toggle-header" role="button" tabindex="0" aria-expanded="false" aria-controls="contenido-categorias">
                        <h4>${i18n.estadisticas?.['porCategoria'] || 'Por Categoría'}</h4>
                        <span class="toggle-icon">▶</span>
                    </div>
                    <div id="contenido-categorias" class="toggle-content" aria-hidden="true">
                        <ul class="lista-categorias">
                            ${itemsCategorias}
                        </ul>
                    </div>
                </div>

                <div id="estadisticas-rarezas">
                    <div class="toggle-header" role="button" tabindex="0" aria-expanded="false" aria-controls="contenido-rareza">
                        <h4>${i18n.estadisticas?.['porRareza'] || 'Por Rareza'}</h4>
                        <span class="toggle-icon">▶</span>
                    </div>
                    <div id="contenido-rareza" class="toggle-content" aria-hidden="true">
                        <ul class="lista-categorias">
                            ${itemsRarezas}
                        </ul>
                    </div>
                </div>
            </div>
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
// Configuración global
const App = {
    config: {
        CONTRATO: '0x199f5418551db3afa002470c11c2f7eba5154a43',
        IPFS_GATEWAY: [
            'https://ipfs.io/ipfs/',
            'https://gateway.pinata.cloud/ipfs/',
            'https://dweb.link/ipfs/'
        ],
        IPFS_HASH: 'QmVTjuDQv2cUyZjeGAXpnbrcL1gGm9UMQJKGU7APscuTxP',
        OPENSEA_URL: 'https://opensea.io/assets/ethereum/',
        RARIBLE_URL: 'https://rarible.com/ethereum/items/',
        OKX_URL: 'https://web3.okx.com/es-es/nft/asset/eth/',
        LOOKSRARE_URL: 'https://looksrare.org/es/collections/',
        MAGICEDEN_URL: 'https://magiceden.io/item-details/ethereum/',
        PLATAFORMAS: {
            OPENSEA: 'OpenSea',
            RARIBLE: 'Rarible',
            OKX: 'OKX NFT',
            LOOKSRARE: 'LooksRare',
            MAGICEDEN: 'Magic Eden'
        },
        ordenAtributos: [
        'AH#',
        'RAREZA',
        'AÑO',
        'TIRADA',
        'TIRADA LOCAL',
        'TIRADA MÁXIMA',
        'COMPOSICIÓN',
        'ALINEACIÓN',
        'CANTO',
        'FORMA',
        'CECA',
        'PESO',
        'DIÁMETRO',
        'CALIDAD'
        ]
    },
    estado: {
        owner: '',
        walletConectada: false,
        direccionWallet: '',
        nfts: [],
        nftsFiltrados: [],
        categorias: {},
        valores: {},
        anios: {},
        composiciones: {},
        alineaciones: {},
        cantos: {},
        cecas: {},
        paginaActual: 1,
        itemsPorPagina: 10,
        metadatosCache: {},
        nftsPoseidos: []
    }
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    (async () => {
        try {
            await inicializarApp();
            inicializarEventos();
        } catch (error) {
            console.error('Error al inicializar:', error);
            mostrarError(App.estado.i18n?.error?.critico || 'Error crítico al cargar la aplicación.');
        }
    })();
});

async function inicializarApp() {
    mostrarLoading(true);
    try {
        await Promise.all([
            cargarDatosNFTs(),
            // Espera a que i18n esté listo
            new Promise(resolve => {
                if (App.estado.i18n) resolve();
                else document.addEventListener('i18nLoaded', resolve);
            })
        ]);
        await precargarMetadatas();
        extraerValoresDesdeMetadata();
        extraerAniosDesdeMetadata();
        extraerComposicionesDesdeMetadata();
        extraerCantosDesdeMetadata();
        extraerCecasDesdeMetadata();
        inicializarFiltros();
        aplicarFiltro();
        mostrarAdvertencia(App.estado.i18n?.advertencia?.conecteWallet || 'Wallet no conectada.\nInicie sesión para ver su colección a color.');
    } catch (error) {
        console.error('Error en inicializarApp:', error);
        mostrarError(App.estado.i18n?.error?.inicializar || 'Error al inicializar la aplicación: ' + error.message);
    } finally {
        mostrarLoading(false);
    }
}

function inicializarEventos() {
    // Eventos de wallet
    document.getElementById('btn-conectar').addEventListener('click', conectarWallet);
    document.getElementById('btn-conectar-banner').addEventListener('click', conectarWallet);
    document.getElementById('btn-cerrar-banner').addEventListener('click', cerrarBannerSorteo);
    
    // Eventos de filtros
    document.getElementById('limpiar-filtros').addEventListener('click', limpiarFiltros);
    document.getElementById('filtro-categoria').addEventListener('change', aplicarFiltro);
    document.getElementById('filtro-rareza').addEventListener('change', aplicarFiltro);
    document.getElementById('filtro-valor').addEventListener('change', aplicarFiltro);
    document.getElementById('filtro-anio').addEventListener('change', aplicarFiltro);
    document.getElementById('filtro-composicion').addEventListener('change', aplicarFiltro);
    document.getElementById('filtro-alineacion').addEventListener('change', aplicarFiltro);
    document.getElementById('filtro-canto').addEventListener('change', aplicarFiltro);
    document.getElementById('filtro-forma').addEventListener('change', aplicarFiltro);
    document.getElementById('filtro-ceca').addEventListener('change', aplicarFiltro);
    document.getElementById('filtro-propios').addEventListener('change', aplicarFiltro);
    document.getElementById('filtro-paginador').addEventListener('change', cambiarPagina);
    
    // Eventos de paginación
    document.getElementById('btn-anterior').addEventListener('click', paginaAnterior);
    document.getElementById('btn-siguiente').addEventListener('click', paginaSiguiente);
    document.getElementById('btn-primera').addEventListener('click', irAPrimeraPagina);
    document.getElementById('btn-ultima').addEventListener('click', irAUltimaPagina);

    // Eventos de transferencia
    document.getElementById('popup-cerrar').addEventListener('click', cerrarPopupTransferencia);
    // Envío del formulario
    const form = document.getElementById('form-transferencia');
    if (form) {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            confirmarTransferencia();
        });
    }
    
    // Escucha cambios de wallet
    if (window.ethereum) {
        window.ethereum.on('accountsChanged', manejarCambioCuentas);
        window.ethereum.on('chainChanged', manejarCambioRed);
    }
}

async function aplicarFiltro() {
    filtrarNFTs();
    await renderizarNFTs();
}

async function limpiarFiltros() {
    const filtroCategoria = document.getElementById('filtro-categoria');
    const filtroRareza = document.getElementById('filtro-rareza');
    const filtroValor = document.getElementById('filtro-valor');
    const filtroAnio = document.getElementById('filtro-anio');
    const filtroComposicion = document.getElementById('filtro-composicion');
    const filtroAlineacion = document.getElementById('filtro-alineacion');
    const filtroCanto = document.getElementById('filtro-canto');
    const filtroForma = document.getElementById('filtro-forma');
    const filtroCeca = document.getElementById('filtro-ceca');
    const checkboxPropios = document.getElementById('filtro-propios');

    filtroCategoria.value = 'todas';
    filtroRareza.value = 'todas';
    filtroValor.value = 'todos';
    filtroAnio.value = 'todos';
    filtroComposicion.value = 'todas';
    filtroAlineacion.value = 'todas';
    filtroCanto.value = 'todos';
    filtroForma.value = 'todas';
    filtroCeca.value = 'todas';
    checkboxPropios.checked = false;

    await aplicarFiltro();
}

function cambiarPagina(e) {
    App.estado.itemsPorPagina = parseInt(e.target.value);
    App.estado.paginaActual = 1;
    renderizarNFTs();
    scrollToTop();
}

function irAPrimeraPagina() {
    if (App.estado.paginaActual > 1) {
        App.estado.paginaActual = 1;
        renderizarNFTs();
        scrollToTop();
    }
}

function paginaAnterior() {
    if (App.estado.paginaActual > 1) {
        App.estado.paginaActual--;
        renderizarNFTs();
        scrollToTop();
    }
}

function paginaSiguiente() {
    const totalPaginas = Math.ceil(App.estado.nftsFiltrados.length / App.estado.itemsPorPagina);
    if (App.estado.paginaActual < totalPaginas) {
        App.estado.paginaActual++;
        renderizarNFTs();
        scrollToTop();
    }
}

function irAUltimaPagina() {
    const totalPaginas = Math.ceil(App.estado.nftsFiltrados.length / App.estado.itemsPorPagina);
    if (App.estado.paginaActual < totalPaginas) {
        App.estado.paginaActual = totalPaginas;
        renderizarNFTs();
        scrollToTop();
    }
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth' // Desplazamiento suave
    });
    
    // Alternativa para navegadores más antiguos
    document.documentElement.scrollTop = 0;
}

function manejarCambioCuentas(cuentas) {
    if (cuentas.length > 0) {
        App.estado.direccionWallet = cuentas[0];
        App.estado.walletConectada = true;
        cargarTodosLosBalances().then(() => {
            aplicarFiltro();
        });
    } else {
        // Wallet desconectada
        App.estado.walletConectada = false;
        App.estado.direccionWallet = '';
        App.estado.nftsPoseidos = [];
        actualizarUIWallet();
        aplicarFiltro();
    }
}

function manejarCambioRed() {
    window.location.reload();
}

function mostrarLoading(mostrar) {
    const loadingElement = document.getElementById('loading');
    mostrar ? loadingElement.classList.remove('hidden') : loadingElement.classList.add('hidden');
}

function mostrarError(mensaje) {
    const div = document.createElement('div');
    div.className = 'error-mensaje';
    div.textContent = mensaje;
    document.body.appendChild(div);
    
    setTimeout(() => {
        div.remove();
    }, 5000);
}

function mostrarAdvertencia(mensaje) {
    const div = document.createElement('div');
    div.className = 'advertencia';
    div.textContent = mensaje;
    document.body.appendChild(div);
    
    setTimeout(() => {
        div.remove();
    }, 8000);
}

function mostrarExito(mensaje) {
    const div = document.createElement('div');
    div.className = 'mensaje-exito';
    div.textContent = mensaje;
    document.body.appendChild(div);

    setTimeout(() => {
        div.remove();
    }, 5000);
}

function limpiarNombreDeValor(nombre) {
    return nombre
        .replace(/\(.*?\)/g, '')         // elimina paréntesis
        .replace(/\[.*?\]/g, '')         // elimina corchetes
        .replace(/\bDE AUSTRAL\b/gi, '') // elimina "DE AUSTRAL"
        .trim();
}

//  Extrae todos los valores únicos de la metadata de los NFTs
function extraerValoresDesdeMetadata() {
    const valoresSet = new Set();

    App.estado.nfts.forEach(nft => {
        const metadata = nft.metadata;
        if (metadata && metadata.name) {
            let valor = limpiarNombreDeValor(metadata.name);
            valoresSet.add(valor);
        }
    });

    // Ordena reemplazando ½ por 0.5 solo para ordenamiento
    const valoresOrdenados = [...valoresSet]
        .map(v => ({
            original: v,
            ordenable: v.replace(/^½/, '0.5')  // Para que "½" quede antes de "1"
        }))
        .sort((a, b) => a.ordenable.localeCompare(b.ordenable, 'es', { numeric: true, sensitivity: 'base' }));

    // Guarda los valores en estado
    App.estado.valores = { todos: true };
    valoresOrdenados.forEach(({ original }) => {
        App.estado.valores[original.trim()] = true;
    });
}

//  Extrae todos los años únicos de la metadata de los NFTs
function extraerAniosDesdeMetadata() {
    const aniosSet = new Set();

    App.estado.nfts.forEach(nft => {
        const metadata = nft.metadata;
        if (metadata && Array.isArray(metadata.attributes)) {
            const attrAnio = metadata.attributes.find(attr =>
                (attr.trait_type || '').toUpperCase() === 'AÑO'
            );
            if (attrAnio && attrAnio.value) {
                aniosSet.add(attrAnio.value.toString());
            }
        }
    });

    // Guarda los años en estado ordenados ascendentemente
    App.estado.anios = { todos: true };
    [...aniosSet]
        .sort((a, b) => parseInt(a) - parseInt(b))
        .forEach(anio => {
            App.estado.anios[anio] = true;
        });
}

// Normaliza las composiciones
function normalizarComposicion(valor) {
    const agrupaciones = {
        '750 Cu + 25 Ni': 'cuproniquel',
        '750 Cu + 250 Ni': 'cuproniquel',
        '700 Al + 300 Mg': 'aluminio',
        '900 Ag + 100 Cu': 'plata',
        '925 Ag + 75 Cu': 'plata',
        '999 Au': 'oro',
        '900 Au + 100 Cu': 'oro',
        '920 Cu + 80 Al': 'bronce',
        '920 Cu + 80 Al ': 'bronce',
        '950 Cu + 40 Sn + 10 Zn': 'cobre',
        '970 Cu + 5 Sn + 25 Zn': 'cobre',
        '1000 Ni': 'niquel',
        'Acero electrodepositado con latón': 'aceroLaton',
        'Acero enchapado en cuproníquel': 'aceroCuproniquel',
        'Alpaca homogénea con níquel 700 Cu + 245 Zn + 55 Ni': 'alpacaNiquel',
        'Anillo:   75 Cu + 25 Ni - Núcleo: 920 Cu + 60 Al + 20 Ni': 'bimetalica',
        'Anillo:   750 Cu + 250 Ni - Núcleo: 920 Cu + 60 Al + 20 Ni': 'bimetalica',
        'Anillo:   920 Cu + 60 Al + 20 Ni - Núcleo: 750 Cu + 250 Ni': 'bimetalica'
    };

    return agrupaciones[valor] || valor;
}

//  Extrae todas las composiciones únicas de la metadata de los NFTs
function extraerComposicionesDesdeMetadata() {
    const composicionesSet = new Set();

    App.estado.nfts.forEach(nft => {
        const metadata = nft.metadata;
        if (metadata && Array.isArray(metadata.attributes)) {
            const attrComposicion = metadata.attributes.find(attr =>
                (attr.trait_type || '')=== 'COMPOSICIÓN'
            );
            if (attrComposicion && attrComposicion.value) {
                composicionesSet.add(normalizarComposicion(attrComposicion.value));
            }
        }
    });

    // Guarda las composiciones en estado
    App.estado.composiciones = { todas: true };
    [...composicionesSet]
    .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
    .forEach(composicion => {
        App.estado.composiciones[composicion] = true;
    });
}

// Normaliza los cantos
function normalizarCanto(valor) {
    const agrupaciones = {
        'Liso': 'liso',
        '“IGUALDAD | * ANTE * LA | * LEY **** |”': 'parlante',
        'Estriado Discontinuo': 'estriadoDiscontinuo',
        '14 e/cm.': 'estriado',
        '14 (±1) e/cm.': 'estriado',
        '15 e/cm.': 'estriado',
        '16 e/cm.': 'estriado',
        '19 e/cm.': 'estriado',
        '20 e/cm.': 'estriado',
        '21 e/cm': 'estriado',
        '21 e/cm.': 'estriado',
        '22 e/cm': 'estriado',
        '22 e/cm.': 'estriado',
        '23 e/cm.': 'estriado',
        '24 e/cm': 'estriado',
        '24 e/cm.': 'estriado',
        '26 e/cm': 'estriado',
        '26 e/cm.': 'estriado'
    };

    return agrupaciones[valor] || valor;
}

//  Extrae todos los cantos únicos de la metadata de los NFTs
function extraerCantosDesdeMetadata() {
    const cantosSet = new Set();

    App.estado.nfts.forEach(nft => {
        const metadata = nft.metadata;
        if (metadata && Array.isArray(metadata.attributes)) {
            const attrCanto = metadata.attributes.find(attr =>
                (attr.trait_type || '') === 'CANTO'
            );
            if (attrCanto && attrCanto.value) {
                cantosSet.add(normalizarCanto(attrCanto.value));
            }
        }
    });

    // Guarda los cantos en estado
    App.estado.cantos = { todos: true };
    [...cantosSet]
    .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
    .forEach(canto => {
        App.estado.cantos[canto] = true;
    });
}

//  Extrae todas las cecas únicas de la metadata de los NFTs
function extraerCecasDesdeMetadata() {
    const cecasSet = new Set();

    App.estado.nfts.forEach(nft => {
        const metadata = nft.metadata;
        if (metadata && Array.isArray(metadata.attributes)) {
            const attrCeca = metadata.attributes.find(attr =>
                (attr.trait_type || '') === 'CECA'
            );
            if (attrCeca && attrCeca.value) {
                cecasSet.add(attrCeca.value);
            }
        }
    });

    // Guarda las cecas en estado
    App.estado.cecas = { todas: true };
    [...cecasSet]
    .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
    .forEach(ceca => {
        App.estado.cecas[ceca] = true;
    });
}

// Cierra el Banner del Sorteo para siempre
function cerrarBannerSorteo() {
    localStorage.setItem("bannerSorteoOculto", "si");
    document.getElementById("banner-sorteo").classList.add('hidden');
    clearTimeout(autoHideTimeout);
}

// Muestra el Banner del Sorteo a los 10 segundos de carga total del sitio, si no fue ocultado
let autoHideTimeout;
window.addEventListener("load", () => {
  setTimeout(() => {
    if (localStorage.getItem("bannerSorteoOculto") !== "si") {
      const banner = document.getElementById("banner-sorteo");
      banner.classList.remove('hidden');

      // Lo oculta automáticamente a los 10 segundos
      autoHideTimeout = setTimeout(() => {
        banner.classList.add('hidden');
      }, 10000);
    }
  }, 10000); // Lo muestra a los 10 segundos
});
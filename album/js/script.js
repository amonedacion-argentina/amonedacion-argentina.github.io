// Configuración global
const App = {
    config: {
        CONTRATO: '0x199f5418551db3afa002470c11c2f7eba5154a43',
        IPFS_GATEWAY: [
            'https://ipfs.io/ipfs/',
            'https://gateway.pinata.cloud/ipfs/',
            'https://dweb.link/ipfs/'
        ],
        IPFS_HASH: 'bafybeidph7szu4urvlkzzyappcsm2nuvzeoveehx2byku4xyxwmb6eq5py',
        OPENSEA_URL: 'https://opensea.io/assets/ethereum/',
        RARIBLE_URL: 'https://rarible.com/token/',
        OKX_URL: 'https://web3.okx.com/es-es/nft/asset/eth/',
        LOOKSRARE_URL: 'https://looksrare.org/es/collections/',
        MAGICEDEN_URL: 'https://magiceden.io/item-details/ethereum/',
        PLATAFORMAS: {
            OPENSEA: 'OpenSea',
            RARIBLE: 'Rarible',
            OKX: 'OKX NFT',
            LOOKSRARE: 'LooksRare',
            MAGICEDEN: 'Magic Eden'
        }
    },
    estado: {
        walletConectada: false,
        direccionWallet: '',
        nfts: [],
        nftsFiltrados: [],
        categorias: {},
        paginaActual: 1,
        itemsPorPagina: 10,
        metadatosCache: {},
        nftsPoseidos: []
    }
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    // Usamos una función autoinvocada async
    (async () => {
        try {
            await inicializarApp();
            inicializarEventos();
        } catch (error) {
            console.error('Error al inicializar:', error);
            mostrarError('Error crítico al cargar la aplicación');
        }
    })();
});

async function inicializarApp() {
    mostrarLoading(true);
    
    try {
        await cargarDatosNFTs();
        inicializarFiltros();
        
        const filtrosContainer = document.querySelector('.filtros');
        if (filtrosContainer && !document.getElementById('estadisticas-container')) {
            const statsContainer = document.createElement('div');
            statsContainer.id = 'estadisticas-container';
            statsContainer.className = 'estadisticas-container hidden';
            filtrosContainer.insertAdjacentElement('afterend', statsContainer);
        }
        
        filtrarNFTs();
        renderizarNFTs();
    } catch (error) {
        console.error('Error en inicializarApp:', error);
        mostrarError('Error al inicializar la aplicación: ' + error.message);
    } finally {
        mostrarLoading(false);
    }
}

function inicializarEventos() {
    // Eventos de wallet
    document.getElementById('btn-conectar').addEventListener('click', conectarWallet);
    
    // Eventos de filtros
    document.getElementById('filtro-categoria').addEventListener('change', cambiarFiltro);
    document.getElementById('filtro-propios').addEventListener('change', cambiarFiltro);
    document.getElementById('filtro-paginacion').addEventListener('change', cambiarPagina);
    
    // Eventos de paginación
    document.getElementById('btn-anterior').addEventListener('click', paginaAnterior);
    document.getElementById('btn-siguiente').addEventListener('click', paginaSiguiente);
    document.getElementById('btn-primera').addEventListener('click', irAPrimeraPagina);
    document.getElementById('btn-ultima').addEventListener('click', irAUltimaPagina);
    
    // Escuchar cambios de wallet
    if (window.ethereum) {
        window.ethereum.on('accountsChanged', manejarCambioCuentas);
        window.ethereum.on('chainChanged', manejarCambioRed);
    }
}

function cambiarFiltro() {
    filtrarNFTs();
    renderizarNFTs();
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
        behavior: 'smooth' // Efecto de desplazamiento suave
    });
    
    // Alternativa para navegadores más antiguos
    document.documentElement.scrollTop = 0;
}

function manejarCambioCuentas(cuentas) {
    if (cuentas.length > 0) {
        App.estado.direccionWallet = cuentas[0];
        App.estado.walletConectada = true;
        cargarTodosLosBalances().then(() => {
            filtrarNFTs();
            renderizarNFTs();
        });
    } else {
        // Wallet desconectada
        App.estado.walletConectada = false;
        App.estado.direccionWallet = '';
        App.estado.nftsPoseidos = [];
        actualizarUIWallet();
        filtrarNFTs();
        renderizarNFTs();
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
    const errorElement = document.createElement('div');
    errorElement.className = 'error-mensaje';
    errorElement.textContent = mensaje;
    document.body.appendChild(errorElement);
    
    setTimeout(() => {
        errorElement.remove();
    }, 5000);
}
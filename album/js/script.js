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
        metadatosCache: {}
    }
};

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    await inicializarApp();
    inicializarEventos();
});

async function inicializarApp() {
    mostrarLoading(true);
    
    try {
        await cargarDatosNFTs();
        await inicializarFiltros();
        filtrarNFTs();
        renderizarNFTs();
    } catch (error) {
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
}

function paginaAnterior() {
    if (App.estado.paginaActual > 1) {
        App.estado.paginaActual--;
        renderizarNFTs();
    }
}

function paginaSiguiente() {
    const totalPaginas = Math.ceil(App.estado.nftsFiltrados.length / App.estado.itemsPorPagina);
    if (App.estado.paginaActual < totalPaginas) {
        App.estado.paginaActual++;
        renderizarNFTs();
    }
}

function manejarCambioCuentas(cuentas) {
    if (cuentas.length > 0) {
        App.estado.direccionWallet = cuentas[0];
        renderizarNFTs();
    } else {
        // Wallet desconectada
        App.estado.walletConectada = false;
        App.estado.direccionWallet = '';
        actualizarUIWallet();
        filtrarNFTs();
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
async function conectarWallet() {
    try {
        // Verificar si MetaMask está instalado
        if (typeof window.ethereum === 'undefined') {
            alert('Por favor, instale MetaMask u otra wallet compatible.');
            return;
        }

        // Solicitar conexión de cuentas
        const cuentas = await window.ethereum.request({ method: 'eth_requestAccounts' });
        App.estado.direccionWallet = cuentas[0];
        App.estado.walletConectada = true;

        // Actualizar UI
        actualizarUIWallet();
        
        // Verificar red correcta (Mainnet Ethereum)
        await verificarRed();
        
        // Cargar NFTs del usuario
        await renderizarNFTs();
    } catch (error) {
        console.error('Error al conectar wallet:', error);
        mostrarError('Error al conectar la wallet');
    }
}

async function verificarRed() {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    if (chainId !== '0x1') { // 0x1 = Mainnet Ethereum
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x1' }],
            });
        } catch (error) {
            alert('Por favor, cambie de red a Ethereum Mainnet en tu wallet.');
        }
    }
}

async function cargarNFTsVisibles() {
    if (!App.estado.walletConectada) return;

    mostrarLoading(true);

    try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contrato = new ethers.Contract(
            App.config.CONTRATO,
            ['function balanceOf(address, uint256) view returns (uint256)'],
            signer
        );

        const inicio = (App.estado.paginaActual - 1) * App.estado.itemsPorPagina;
        const fin = inicio + App.estado.itemsPorPagina;
        const nftsPagina = App.estado.nftsFiltrados.slice(inicio, fin);

        for (const nft of nftsPagina) {
            try {
                const balance = await contrato.balanceOf(App.estado.direccionWallet, nft.id);
                nft.enPropiedad = balance.gt(0);

                if (nft.enPropiedad && !nft.metadata && !nft.cargandoMetadata) {
                    const elemento = document.querySelector(`.nft-card img[alt="NFT ${nft.id}"]`)?.closest('.nft-card');
                    cargarMetadatosNFT(nft, elemento);
                }
            } catch (error) {
                console.error(`Error al verificar balance para el NFT ${nft.id}:`, error);
                nft.enPropiedad = false;
            }
        }

        actualizarEstadisticas();
        renderizarNFTs(); // vuelve a dibujar ahora con propiedad
    } catch (error) {
        console.error('Error al cargar NFTs visibles del usuario:', error);
        mostrarError('Error al cargar sus NFTs.');
    } finally {
        mostrarLoading(false);
    }
}

function actualizarUIWallet() {
    const btnConectar = document.getElementById('btn-conectar');
    const walletInfo = document.getElementById('wallet-info');
    const direccionElement = document.getElementById('wallet-direccion');
    
    if (App.estado.walletConectada) {
        btnConectar.textContent = 'Wallet Conectada';
        btnConectar.classList.add('conectado');
        
        // Mostrar dirección abreviada
        const direccionAbreviada = `${App.estado.direccionWallet.substring(0, 6)}...${App.estado.direccionWallet.substring(38)}`;
        direccionElement.textContent = direccionAbreviada;
        
        walletInfo.classList.remove('hidden');
    } else {
        btnConectar.textContent = 'Conectar Wallet';
        btnConectar.classList.remove('conectado');
        walletInfo.classList.add('hidden');
    }
}
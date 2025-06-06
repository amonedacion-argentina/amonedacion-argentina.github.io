async function conectarWallet() {
    try {
        // Verificar si MetaMask está instalado
        if (typeof window.ethereum === 'undefined') {
            alert('Por favor, instale MetaMask u otra wallet compatible con la red de Ethereum.');
            return;
        }

        // Solicitar conexión de cuentas
        const cuentas = await window.ethereum.request({ method: 'eth_requestAccounts' });
        App.estado.direccionWallet = cuentas[0];
        App.estado.walletConectada = true;
       
        // Verificar red correcta (Mainnet Ethereum)
        await verificarRed();

        // Actualizar UI
        actualizarUIWallet();
        
        // Carga balances antes de renderizar
        await cargarTodosLosBalances();

        // Asegura que los filtros se apliquen
        filtrarNFTs();

        // Carga NFTs del usuario
        renderizarNFTs();
    } catch (error) {
        console.error('Error al conectar wallet:', error);
        mostrarError('Error al conectar la wallet.');
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
            alert('Por favor, cambie de red a Ethereum Mainnet en su wallet.');
        }
    }
}

function actualizarUIWallet() {
    const btnConectar = document.getElementById('btn-conectar');
    if (App.estado.walletConectada) {
        // Mostrar dirección abreviada
        const direccionAbreviada = `${App.estado.direccionWallet.substring(0, 4)}...${App.estado.direccionWallet.substring(38)}`;
        btnConectar.textContent = direccionAbreviada;
        btnConectar.classList.add('conectado');
    } else {
        btnConectar.textContent = 'Conectar';
        btnConectar.classList.remove('conectado');
    }
}
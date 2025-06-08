async function conectarWallet() {
    try {
        // Espera a que esté cargado el estado y las traducciones
        if (!App.estado?.i18n) {
            await new Promise((resolve, reject) => {
                const check = setInterval(() => {
                    if (App.estado?.i18n) {
                        clearInterval(check);
                        resolve();
                    }
                }, 100);
                setTimeout(() => {
                    clearInterval(check);
                    reject(new Error('Timeout esperando carga de traducciones'));
                }, 3000);
            });
        }

        // Verificar si MetaMask está instalado
        if (typeof window.ethereum === 'undefined') {
            mostrarError(App.estado.i18n?.error?.instale-metamask || 'Por favor, instale MetaMask...');
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
        mostrarError(App.estado.i18n?.error?.wallet || 'Error al conectar la wallet.');
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
    const divFiltroPropios = document.getElementById('div-filtro-propios');
    if (App.estado.walletConectada) {
        // Muestra dirección abreviada
        const direccionAbreviada = `${App.estado.direccionWallet.substring(0, 4)}...${App.estado.direccionWallet.substring(38)}`;
        btnConectar.textContent = direccionAbreviada;
        btnConectar.classList.add('conectado');
        // Muestra el filtro para NFTs propios
        divFiltroPropios.classList.remove('hidden');
    } else {
        btnConectar.textContent = 'Conectar';
        btnConectar.classList.remove('conectado');
        // Oculta el filtro para NFTs propios
        divFiltroPropios.classList.add('hidden');
    }
}
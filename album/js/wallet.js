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
                    reject(new Error('Timeout esperando carga de traducciones.'));
                }, 5000);
            });
        }

        // Verifica si MetaMask está instalado
        if (typeof window.ethereum === 'undefined') {
            mostrarError(App.estado.i18n?.error?.instaleMetamask || 'Por favor, instale MetaMask...');
            return;
        }

        // Solicita conexión de cuentas
        const cuentas = await window.ethereum.request({ method: 'eth_requestAccounts' });
        App.estado.direccionWallet = cuentas[0];
        App.estado.walletConectada = true;
       
        // Verifica red correcta (Mainnet Ethereum)
        await verificarRed();

        // Actualiza UI
        actualizarUIWallet();

        // Carga balances antes de renderizar
        await cargarTodosLosBalances();

        // Asegura que los filtros se apliquen
        await aplicarFiltro();

        mostrarAdvertencia(App.estado.i18n?.advertencia?.faltantes || 'Monedas grises: Ausentes en su colección...');
    } catch (error) {
        console.error('Error al conectar wallet:', error);
        mostrarError(App.estado.i18n?.error?.wallet || 'Error al conectar la wallet.');
        mostrarLoading(false);
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
            alert(App.estado.i18n?.error?.cambieDeRed || 'Por favor, cambie de red a Ethereum...');
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
        btnConectar.disabled = true;
        // Muestra el filtro para NFTs propios
        divFiltroPropios.classList.remove('hidden');
    } else {
        btnConectar.textContent = 'Conectar';
        btnConectar.classList.remove('conectado');
        btnConectar.disabled = false;
        // Oculta el filtro para NFTs propios
        divFiltroPropios.classList.add('hidden');
    }
}
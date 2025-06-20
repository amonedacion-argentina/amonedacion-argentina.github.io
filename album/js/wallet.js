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
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        App.estado.direccionWallet = await signer.getAddress();
        App.estado.walletConectada = true;
       
        // Verifica red correcta (Mainnet Ethereum)
        await verificarRed();

        // Actualiza UI
        actualizarUIWallet();

        // Carga balances antes de renderizar
        await cargarTodosLosBalances();

        // Asegura que los filtros se apliquen
        await aplicarFiltro();

        // Genera log de conexión
        await generarLog(App.estado.direccionWallet);

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
    const divFiltroValor = document.getElementById('div-filtro-valor');
    const divFiltroAnio = document.getElementById('div-filtro-anio');
    const divFiltroComposicion = document.getElementById('div-filtro-composicion');
    const divFiltroAlineacion = document.getElementById('div-filtro-alineacion');
    const divFiltroCanto = document.getElementById('div-filtro-canto');
    const divFiltroForma = document.getElementById('div-filtro-forma');
    const divFiltroCeca = document.getElementById('div-filtro-ceca');
    const divFiltroPropios = document.getElementById('div-filtro-propios');

    if (App.estado.walletConectada) {
        // Muestra dirección abreviada
        const direccionAbreviada = `${App.estado.direccionWallet.substring(0, 4)}...${App.estado.direccionWallet.substring(38)}`;
        btnConectar.textContent = direccionAbreviada;
        btnConectar.classList.add('conectado');
        btnConectar.disabled = true;
        // Muestra los filtros avanzados
        divFiltroValor.classList.remove('hidden');
        divFiltroAnio.classList.remove('hidden');
        divFiltroComposicion.classList.remove('hidden');
        divFiltroAlineacion.classList.remove('hidden');
        divFiltroCanto.classList.remove('hidden');
        divFiltroForma.classList.remove('hidden');
        divFiltroCeca.classList.remove('hidden');
        divFiltroPropios.classList.remove('hidden');
    } else {
        btnConectar.textContent = 'Conectar';
        btnConectar.classList.remove('conectado');
        btnConectar.disabled = false;
        // Oculta los filtros avanzados
        divFiltroValor.classList.add('hidden');
        divFiltroAnio.classList.add('hidden');
        divFiltroComposicion.classList.add('hidden');
        divFiltroAlineacion.classList.add('hidden');
        divFiltroCanto.classList.add('hidden');
        divFiltroForma.classList.add('hidden');
        divFiltroCeca.classList.add('hidden');
        divFiltroPropios.classList.add('hidden');
    }
}

async function generarLog(wallet) {
  try {
    const ip = await fetch("https://api.ipify.org?format=json")
      .then(res => res.json())
      .then(data => data.ip)
      .catch(() => "IP desconocida");

    const userAgent = navigator.userAgent;
    const logUrl = "https://script.google.com/macros/s/AKfycby2QyexajoY5yRjTBphQmQzFbpUulBxHgT4mVajkJ44rvFWKKl25ZJBCqOyelKMGhxbpg/exec";
    const url = `${logUrl}?wallet=${encodeURIComponent(wallet)}&ip=${encodeURIComponent(ip)}&userAgent=${encodeURIComponent(userAgent)}`;

    await fetch(url, { method: "GET" })
      .then(() => console.log("Log generado."))
      .catch((e) => console.warn("Advertencia (error CORS): ", e));
  } catch (error) {
    console.error("Error inesperado generando log: ", error);
  }
}
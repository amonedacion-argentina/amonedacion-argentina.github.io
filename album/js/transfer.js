// Transferencia de NFTs
let nftSeleccionado = null;
function abrirPopupTransferencia(nftId) {
    nftSeleccionado = App.estado.nfts.find(n => n.id === nftId);

    if (!nftSeleccionado) return;

    const metadata = nftSeleccionado.metadata;
    const elemAH = document.getElementById('popup-moneda-ah');
    if (elemAH && metadata && Array.isArray(metadata.attributes)) {
        const attrAH = metadata.attributes.find(attr => (attr.trait_type || '') === 'AH#');
        if (attrAH && attrAH.value) {
            elemAH.textContent = attrAH.value;
        } else {
            elemAH.textContent = '';
        }
    }

    document.getElementById('popup-nft-id').textContent = nftId;
    document.getElementById('direccion-destino').value = '';

    const inputCantidad = document.getElementById('cantidad-transferir');

    if (nftSeleccionado.cantidad > 1) {
        inputCantidad.classList.remove('hidden');
        inputCantidad.value = 1;
        inputCantidad.max = nftSeleccionado.cantidad;
    } else {
        inputCantidad.classList.add('hidden');
        inputCantidad.value = 1;
    }

    document.getElementById('popup-transferencia').classList.remove('hidden');
}

function cerrarPopupTransferencia() {
    document.getElementById('popup-transferencia').classList.add('hidden');
    nftSeleccionado = null;
}

async function confirmarTransferencia() {
    const to = document.getElementById('direccion-destino').value.trim();
    const cantidadStr = document.getElementById('cantidad-transferir').value;
    const cantidad = parseInt(cantidadStr);

    if (!App.estado.walletConectada || !App.estado.direccionWallet) {
        mostrarError(App.estado.i18n?.error?.walletNoConectada || 'Debe conectar su wallet.');
        return;
    }

    if (!to) {
        mostrarError(App.estado.i18n?.error?.dirVacia || 'Debe ingresar una dirección de destino.');
        return;
    }
    
    if (!ethers.utils.isAddress(to)) {
        mostrarError(App.estado.i18n?.error?.dirInvalida || 'Dirección inválida.');
        return;
    }

    if (to.toLowerCase() === App.estado.direccionWallet.toLowerCase()) {
        mostrarError(App.estado.i18n?.error?.mismoDestino || 'No puede transferir a su propia wallet.');
        return;
    }

    if (!cantidadStr || isNaN(cantidad) || cantidad < 1 || cantidad > nftSeleccionado.cantidad) {
        mostrarError(App.estado.i18n?.error?.cantidadInvalida || 'Cantidad inválida.');
        return;
    }

    if (!Number.isInteger(cantidad)) {
        mostrarError(App.estado.i18n?.error?.noEntero || 'La cantidad debe ser un número entero.');
        return;
    }

    const code = await provider.getCode(to);
    if (code !== '0x') {
        mostrarError(App.estado.i18n?.error?.noContrato || 'No se puede transferir a un contrato inteligente.');
        return;
    }

    try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        const contrato = new ethers.Contract(App.config.CONTRATO, [
            'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)'
        ], signer);

        const tx = await contrato.safeTransferFrom(App.estado.direccionWallet, to, nftSeleccionado.id, cantidad, "0x");
        await tx.wait();

        mostrarExito(App.estado.i18n?.transferencia?.realizada || 'Transferencia realizada.');
        cerrarPopupTransferencia();
        await cargarTodosLosBalances();
    } catch (error) {
        console.error('Error al transferir: ', error);
        mostrarError(App.estado.i18n?.error?.alTransferir || 'Error al realizar la transferencia.');
    }
}
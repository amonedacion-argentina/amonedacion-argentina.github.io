async function connectMetaMask() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            loadNFTData(provider);
        } catch (error) {
            console.error("Error conectando a MetaMask:", error);
        }
    } else {
        console.log("Por favor, instala MetaMask!");
    }
}

async function loadNFTData(provider) {
    const nftId = 1; // ID del NFT
    const contractAddress = "0x199f5418551db3afa002470c11c2f7eba5154a43"; // Dirección del contrato
    const abiResponse = await fetch('abi.json');
    const abi = await abiResponse.json();
    const contract = new ethers.Contract(contractAddress, abi, provider);
    
    try {
        const data = await contract.uri(nftId);
        // Cambia aquí para construir correctamente la URL
        const jsonDataUrl = data.replace("ipfs://", "https://ipfs.io/ipfs/") + nftId; // Añade el ID al final
        const jsonResponse = await fetch(jsonDataUrl);
        const nftData = await jsonResponse.json();
        displayNFTData(nftData);
    } catch (error) {
        console.error("Error cargando datos del NFT:", error);
    }
}

function displayNFTData(data) {
    document.getElementById('nftName').innerText = data.name;
    document.getElementById('nftDescription').innerText = data.description || ""; // Mostrar descripción solo si existe

    const imageUrl = data.image.replace("ipfs://", "https://ipfs.io/ipfs/");
    const imageElement = document.getElementById('nftImage');
    imageElement.src = imageUrl;

    const attributesContainer = document.getElementById('nftAttributes');
    attributesContainer.innerHTML = "";
    data.attributes.forEach(attr => {
        const div = document.createElement('div');
        div.innerText = `${attr.trait_type}: ${attr.value}`;
        attributesContainer.appendChild(div);
    });

    document.getElementById('nftData').style.display = 'block';
}

// Registro del evento del botón
document.getElementById('connectButton').addEventListener('click', connectMetaMask);

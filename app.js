async function connectMetaMask() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            await ethereum.request({ method: 'eth_requestAccounts' });
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            loadNFTData(provider);
        } catch (error) {
            console.error("Error conectando a MetaMask:", error);
        }
    } else {
        alert("MetaMask no está instalado.");
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
        const ipfsUrl = data.replace("ipfs://", "https://ipfs.io/ipfs/"); 
        const jsonDataUrl = `${ipfsUrl}${nftId}`; // Construimos la URL completa con el ID

        const jsonResponse = await fetch(jsonDataUrl);
        if (!jsonResponse.ok) {
            throw new Error('Error en la respuesta de la red');
        }
        const nftData = await jsonResponse.json();
        displayNFTData(nftData);
    } catch (error) {
        console.error("Error cargando datos del NFT:", error);
    }
}

function displayNFTData(nftData) {
    document.getElementById('nftName').textContent = nftData.name;

    // Mostrar imagen
    const nftImage = document.getElementById('nftImage');
    nftImage.src = nftData.image.replace("ipfs://", "https://ipfs.io/ipfs/");
    
    // Verificar si hay descripción
    const nftDescription = document.getElementById('nftDescription');
    if (nftData.description) {
        nftDescription.textContent = nftData.description;
    } else {
        nftDescription.style.display = 'none'; // Si no hay descripción, no se muestra nada
    }

    // Mostrar atributos
    const nftAttributes = document.getElementById('nftAttributes');
    nftAttributes.innerHTML = ''; // Limpiar atributos anteriores
    nftData.attributes.forEach(attr => {
        const li = document.createElement('li');
        li.textContent = `${attr.trait_type}: ${attr.value}`;
        nftAttributes.appendChild(li);
    });
}

document.getElementById('connectButton').addEventListener('click', connectMetaMask);

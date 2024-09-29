async function connectMetaMask() {
    if (window.ethereum) {
        try {
            await ethereum.request({ method: 'eth_requestAccounts' });
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            loadNFTData(provider);
        } catch (error) {
            console.error("Error al conectar MetaMask:", error);
        }
    } else {
        alert('MetaMask no está instalado.');
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

        const jsonResponse = await fetch(ipfsUrl);
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

    const imageUrl = nftData.image.replace("ipfs://", "https://ipfs.io/ipfs/");
    const nftImage = document.getElementById('nftImage');
    nftImage.src = imageUrl;
    nftImage.classList.add('responsive-img'); // Clase para imagen pequeña y responsiva

    // Mostrar la descripción solo si existe
    const nftDescription = document.getElementById('nftDescription');
    if (nftData.description) {
        nftDescription.textContent = nftData.description;
    } else {
        nftDescription.style.display = 'none';
    }

    // Mostrar atributos
    const nftAttributesList = document.getElementById('nftAttributes');
    nftAttributesList.innerHTML = ''; // Limpiar antes de mostrar
    nftData.attributes.forEach(attr => {
        const li = document.createElement('li');
        li.textContent = `${attr.trait_type}: ${attr.value}`;
        nftAttributesList.appendChild(li);
    });
}

document.getElementById('connectButton').addEventListener('click', connectMetaMask);

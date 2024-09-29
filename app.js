const contractAddress = "0x199f5418551db3afa002470c11c2f7eba5154a43";
const nftId = 1; // ID de la moneda NFT

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
    const abi = await fetch('abi.json').then(response => response.json());
    const contract = new ethers.Contract(contractAddress, abi, provider);
    
    try {
        // Obtener el tokenURI
        const tokenURI = await contract.uri(nftId);
        
        // Reemplazar el esquema IPFS
        const validTokenURI = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/");
        
        // Fetch los datos desde el tokenURI modificado
        const response = await fetch(validTokenURI);
        
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        
        const data = await response.json();
        displayNFTData(data);
    } catch (error) {
        console.error("Error cargando datos del NFT:", error);
    }
}

function displayNFTData(data) {
    document.getElementById('nftName').innerText = data.name;
    document.getElementById('nftDescription').innerText = data.description || "No hay descripción disponible";
    
    // Reemplazar el esquema IPFS en la URL de la imagen
    const imageUrl = data.image.replace("ipfs://", "https://ipfs.io/ipfs/");
    document.getElementById('nftImage').src = imageUrl;

    const attributesContainer = document.getElementById('nftAttributes');
    attributesContainer.innerHTML = "";
    data.attributes.forEach(attr => {
        const div = document.createElement('div');
        div.innerText = `${attr.trait_type}: ${attr.value}`;
        attributesContainer.appendChild(div);
    });

    document.getElementById('nftData').style.display = 'block';
}

document.getElementById('connectButton').addEventListener('click', connectMetaMask);

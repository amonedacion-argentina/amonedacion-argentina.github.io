const contractAddress = "0x199f5418551db3afa002470c11c2f7eba5154a43";
const tokenId = 1;

async function connectMetaMask() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            loadNFTData();
        } catch (error) {
            console.error("Error connecting to MetaMask:", error);
        }
    } else {
        alert("Por favor, instala MetaMask!");
    }
}

async function loadNFTData() {
    const response = await fetch("abi.json");
    const abi = await response.json();

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(contractAddress, abi, provider);

    try {
        // Llama a la función uri para obtener el URI de la NFT
        const nftData = await contract.uri(tokenId);
        
        // Reemplaza {{id}} por el tokenId en la URL
        const metadataUrl = nftData.replace("ipfs://", "https://ipfs.io/ipfs/").replace("{{id}}", tokenId);

        // Obtener los metadatos
        const metadata = await fetch(metadataUrl).then(res => res.json());
        displayNFT(metadata);
    } catch (error) {
        console.error("Error fetching NFT data:", error);
        alert("No se pudo obtener la información de la NFT. Verifica el ABI y el contrato.");
    }
}

function displayNFT(metadata) {
    document.getElementById("nftImage").src = metadata.image.replace("ipfs://", "https://ipfs.io/ipfs/");
    document.getElementById("nftName").textContent = metadata.name;
    document.getElementById("nftDescription").textContent = metadata.description;

    const attributesDiv = document.getElementById("attributes");
    attributesDiv.innerHTML = '';

    metadata.attributes.forEach(attr => {
        const p = document.createElement("p");
        p.textContent = `${attr.trait_type}: ${attr.value}`;
        attributesDiv.appendChild(p);
    });

    document.getElementById("nftDetails").classList.remove("hidden");
}

document.getElementById("connectButton").addEventListener("click", connectMetaMask);

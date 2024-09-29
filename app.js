const contractAddress = '0x199f5418551db3afa002470c11c2f7eba5154a43';
const nftId = 1;
let provider;
let signer;
let contract;

async function connectMetaMask() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();
            contract = new ethers.Contract(contractAddress, await getABI(), signer);
            getNFTDetails(nftId);
        } catch (error) {
            console.error("Error connecting to MetaMask:", error);
        }
    } else {
        alert('MetaMask no está instalado. Por favor, instálalo para continuar.');
    }
}

async function getABI() {
    const response = await fetch('abi.json');
    return await response.json();
}

async function getNFTDetails(id) {
    try {
        const uri = await contract.uri(id);
        const response = await fetch(uri);
        const data = await response.json();
        displayNFTDetails(data);
    } catch (error) {
        console.error("Error fetching NFT details:", error);
    }
}

function displayNFTDetails(data) {
    const nftDetails = document.getElementById('nftDetails');
    nftDetails.innerHTML = `
        <h2>${data.name}</h2>
        <img src="${data.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}/${id}" alt="${data.name}">
        <p><strong>Año:</strong> ${getAttributeValue(data, 'AÑO')}</p>
        <p><strong>Tirada:</strong> ${getAttributeValue(data, 'TIRADA')}</p>
        <p><strong>Rareza:</strong> ${getAttributeValue(data, 'RAREZA')}</p>
        <p><strong>Composición:</strong> ${getAttributeValue(data, 'COMPOSICIÓN')}</p>
        <p><strong>Alineación:</strong> ${getAttributeValue(data, 'ALINEACIÓN')}</p>
        <p><strong>Canto:</strong> ${getAttributeValue(data, 'CANTO')}</p>
        <p><strong>Forma:</strong> ${getAttributeValue(data, 'FORMA')}</p>
        <p><strong>Ceca:</strong> ${getAttributeValue(data, 'CECA')}</p>
        <p><strong>Peso:</strong> ${getAttributeValue(data, 'PESO')}</p>
        <p><strong>Diámetro:</strong> ${getAttributeValue(data, 'DIÁMETRO')}</p>
    `;
}

function getAttributeValue(data, traitType) {
    const attribute = data.attributes.find(attr => attr.trait_type === traitType);
    return attribute ? attribute.value : 'N/A';
}

document.getElementById('connectButton').addEventListener('click', connectMetaMask);

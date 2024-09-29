// Conectar a Metamask
const provider = new ethers.providers.Web3Provider(window.ethereum);
await provider.send("eth_requestAccounts", []);
const signer = provider.getSigner();   


// Conectar al contrato
const contractAddress = "0x199f5418551db3afa002470c11c2f7eba5154a43";
const abi = require('./abi.json');
const contract = new ethers.Contract(contractAddress, abi, signer);

// Obtener los datos del NFT
async function getNFTData(tokenId) {
    try {
        const tokenURI = await contract.tokenURI(tokenId);
        const response = await fetch(tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/'));
        const metadata = await response.json();

        // Mostrar los datos en el HTML
        const nftDataDiv = document.getElementById('nft-data');
        nftDataDiv.innerHTML = `
            <img src="https://ipfs.io/ipfs/${metadata.image.split('ipfs://')[1]}">
            <h2>${metadata.name}</h2>
            <p>${metadata.description}</p>
            `;
    } catch (error) {
        console.error('Error fetching NFT data:', error);
    }
}

// Obtener los datos del NFT con ID 1
getNFTData(1);
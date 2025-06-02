const connectWalletButton = document.getElementById('connectWalletButton');
const nftContainer = document.getElementById('nftContainer');
const rarezaFiltro = document.getElementById('rarezaFiltro');
let allNFTs = [];

connectWalletButton.onclick = async () => {
  try {
    if (!window.ethereum) {
      alert("MetaMask no está instalado.");
      return;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const userAddress = await signer.getAddress();

    connectWalletButton.innerText = `Conectado: ${userAddress}`;

    const nfts = await fetchNFTs(userAddress);
    allNFTs = nfts;
    mostrarNFTs(nfts);
    actualizarFiltro(nfts);
  } catch (error) {
    console.error("Error conectando la wallet o cargando NFTs:", error);
  }
};

async function fetchNFTs(address) {
  const apiKey = '952b8e1e814e400eaae026892617b0d5'; // Reemplaza por tu API Key real si cambia
  const url = `https://api.opensea.io/v2/chain/ethereum/account/${userAddress}/nfts`;

  const response = await fetch(url, {
    headers: {
      'X-API-KEY': apiKey
    }
  });

  if (!response.ok) throw new Error(`Error en la consulta: ${response.status}`);

  const data = await response.json();
  return data.nfts || [];
}

function mostrarNFTs(nfts) {
  nftContainer.innerHTML = '';

  nfts.forEach(nft => {
    const div = document.createElement('div');
    div.className = 'nft';

    const image = nft.image_url || nft.image_preview_url || '';
    const name = nft.name || 'NFT sin nombre';
    const link = `https://opensea.io/assets/ethereum/${nft.contract}/` + nft.identifier;
    const atributos = nft.metadata?.attributes || [];

    div.innerHTML = `
      <img src="${image}" alt="${name}">
      <h3>${name}</h3>
      <ul>
        ${atributos.map(attr => `
          <li><strong>${attr.trait_type}:</strong> ${attr.value}</li>
        `).join('')}
      </ul>
      <a href="${link}" target="_blank">Ver en OpenSea</a>
    `;

    nftContainer.appendChild(div);
  });
}

function actualizarFiltro(nfts) {
  const rarezas = new Set();

  nfts.forEach(nft => {
    const atributos = nft.metadata?.attributes || [];
    const rareza = atributos.find(attr => attr.trait_type === "Rareza");
    if (rareza) rarezas.add(rareza.value);
  });

  rarezaFiltro.innerHTML = `<option value="">Todas</option>`;
  [...rarezas].sort().forEach(valor => {
    const opt = document.createElement('option');
    opt.value = valor;
    opt.textContent = valor;
    rarezaFiltro.appendChild(opt);
  });
}

rarezaFiltro.onchange = () => {
  const seleccion = rarezaFiltro.value;

  if (!seleccion) {
    mostrarNFTs(allNFTs);
  } else {
    const filtrados = allNFTs.filter(nft => {
      const attr = nft.metadata?.attributes || [];
      return attr.some(a => a.trait_type === "Rareza" && a.value === seleccion);
    });
    mostrarNFTs(filtrados);
  }
};

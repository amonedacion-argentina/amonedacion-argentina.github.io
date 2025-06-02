const connectWalletButton = document.getElementById('connectWalletButton');
const nftContainer = document.getElementById('nftContainer');
const rarezaFiltro = document.getElementById('rarezaFiltro');
const filtroContratoButton = document.getElementById('filtroContratoButton');
const contador = document.getElementById('contador');
const spinner = document.getElementById('spinner');

const contratoAmonedacion = '0x199f5418551db3afa002470c11c2f7eba5154a43'.toLowerCase();

let allNFTs = [];
let filtrandoPorContrato = false;

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

    mostrarSpinner(true);
    const nfts = await fetchNFTs(userAddress);
    allNFTs = await enrichMetadata(nfts); // Enriquecer para traer atributos si faltan
    mostrarNFTs(allNFTs);
    actualizarFiltro(allNFTs);
    mostrarSpinner(false);
  } catch (error) {
    console.error("Error conectando la wallet o cargando NFTs:", error);
    mostrarSpinner(false);
  }
};

async function fetchNFTs(address) {
  const apiKey = '952b8e1e814e400eaae026892617b0d5';
  const url = `https://api.opensea.io/v2/chain/ethereum/account/${address}/nfts`;

  const response = await fetch(url, {
    headers: {
      'X-API-KEY': apiKey
    }
  });

  if (!response.ok) throw new Error(`Error en la consulta: ${response.status}`);
  const data = await response.json();
  return data.nfts || [];
}

// Función extra para cargar metadatos si están vacíos
async function enrichMetadata(nfts) {
  return await Promise.all(nfts.map(async (nft) => {
    if (!nft.metadata && nft.token_metadata) {
      try {
        const res = await fetch(nft.token_metadata);
        nft.metadata = await res.json();
      } catch {
        nft.metadata = {};
      }
    }
    return nft;
  }));
}

function mostrarNFTs(nfts) {
  nftContainer.innerHTML = '';

  nfts.forEach(nft => {
    const div = document.createElement('div');
    div.className = 'nft';

    const image = nft.image_url || nft.image_preview_url || '';
    const name = nft.name || 'NFT sin nombre';
    const link = `https://opensea.io/assets/ethereum/${nft.contract_address}/${nft.identifier}`;
    const atributos = nft.metadata?.attributes || [];

    div.innerHTML = `
      <img src="${image}" alt="${name}">
      <h3>${name}</h3>
      ${atributos.length > 0 ? `
        <ul>
          ${atributos.map(attr => `
            <li><strong>${attr.trait_type}:</strong> ${attr.value}</li>
          `).join('')}
        </ul>` : ''}
      <a href="${link}" target="_blank">Ver en OpenSea</a>
    `;

    nftContainer.appendChild(div);
  });

  contador.innerText = `Mostrando ${nfts.length} de ${allNFTs.length} NFTs`;
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
  aplicarFiltros();
};

filtroContratoButton.onclick = () => {
  filtrandoPorContrato = !filtrandoPorContrato;
  filtroContratoButton.innerText = filtrandoPorContrato ? 'Mostrar todos los NFTs' : 'Mostrar solo mis NFTs de Amonedación Argentina';
  aplicarFiltros();
};

function aplicarFiltros() {
  const seleccion = rarezaFiltro.value;

  let filtrados = [...allNFTs];

  if (filtrandoPorContrato) {
    filtrados = filtrados.filter(nft => nft.contract_address?.toLowerCase() === contratoAmonedacion);
  }

  if (seleccion) {
    filtrados = filtrados.filter(nft => {
      const attr = nft.metadata?.attributes || [];
      return attr.some(a => a.trait_type === "Rareza" && a.value === seleccion);
    });
  }

  mostrarNFTs(filtrados);
}

function mostrarSpinner(mostrar) {
  spinner.style.display = mostrar ? 'block' : 'none';
}

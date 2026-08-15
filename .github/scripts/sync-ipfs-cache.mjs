import fs from 'node:fs/promises';
import path from 'node:path';

const CONTRACT = '0x199f5418551db3afa002470c11c2f7eba5154a43';
const NFTS_FILE = 'album/json/nfts.json';
const CACHE_DIR = 'album/json/ipfs-cache';
const GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://dweb.link/ipfs/'
];
const RPC_URLS = [
  'https://ethereum-rpc.publicnode.com',
  'https://cloudflare-eth.com'
];
const TIMEOUT_MS = 10000;

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function obtenerCidActual() {
  // selector de uri(uint256) ERC-1155 = 0x0e89341c
  const data = '0x0e89341c' + '0'.repeat(63) + '1';

  for (const rpc of RPC_URLS) {
    try {
      const response = await fetchWithTimeout(rpc, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_call',
          params: [{ to: CONTRACT, data }, 'latest']
        })
      });

      if (!response.ok) continue;
      const result = await response.json();
      if (result.error) continue;
      if (!result.result || result.result === '0x') continue;

      const hex = result.result.slice(2);
      const offsetBytes = Number.parseInt(hex.slice(0, 64), 16);
      const offset = offsetBytes * 2;
      const length = Number.parseInt(hex.slice(offset, offset + 64), 16);
      const stringHex = hex.slice(offset + 64, offset + 64 + length * 2);
      const uri = Buffer.from(stringHex, 'hex').toString('utf8');
      const match = uri.match(/ipfs:\/\/([^/]+)/i);

      if (match) return match[1];
    } catch (error) {
      console.warn(`RPC no disponible (${rpc}): ${error.message}`);
    }
  }

  throw new Error('No se pudo obtener el CID actual del contrato.');
}

async function descargarMetadata(cid, tokenId) {
  for (const gateway of GATEWAYS) {
    try {
      const url = `${gateway}${cid}/${tokenId}`;
      const response = await fetchWithTimeout(url, {
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const metadata = await response.json();
      return { metadata, url };
    } catch (error) {
      console.warn(`NFT ${tokenId} fallo en ${gateway}: ${error.message}`);
    }
  }

  throw new Error(`No se pudo descargar ${tokenId} desde ningún gateway.`);
}

function extraerTokenIds(datos) {
  const grupos = datos?.todasLasEpocas;
  if (!grupos || typeof grupos !== 'object') {
    throw new Error('nfts.json no contiene todasLasEpocas.');
  }
  return [...new Set(Object.values(grupos).flat().map(Number))]
    .filter(Number.isInteger)
    .sort((a, b) => a - b);
}

async function main() {
  console.log('Consultando CID del contrato...');
  const cid = await obtenerCidActual();
  console.log(`CID actual: ${cid}`);

  const datos = JSON.parse(await fs.readFile(NFTS_FILE, 'utf8'));
  const tokenIds = extraerTokenIds(datos);
  await fs.mkdir(CACHE_DIR, { recursive: true });

  let actualizados = 0;
  let sinCambios = 0;
  let fallidos = 0;

  for (const tokenId of tokenIds) {
    try {
      const { metadata, url } = await descargarMetadata(cid, tokenId);
      const contenido = JSON.stringify(metadata, null, 2) + '\n';
      const archivo = path.join(CACHE_DIR, `${tokenId}.json`);

      let anterior = null;
      try {
        anterior = await fs.readFile(archivo, 'utf8');
      } catch {
        // El archivo todavía no existe.
      }

      if (anterior === contenido) {
        sinCambios++;
      } else {
        await fs.writeFile(archivo, contenido, 'utf8');
        actualizados++;
        console.log(`Actualizado ${tokenId}.json desde ${url}`);
      }
    } catch (error) {
      fallidos++;
      console.error(`ERROR NFT ${tokenId}: ${error.message}`);
    }
  }

  console.log(`Resultado: ${actualizados} actualizados, ${sinCambios} sin cambios, ${fallidos} fallidos.`);

  if (fallidos > 0) {
    console.warn('Se conservaron las caches existentes de los NFTs fallidos.');
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

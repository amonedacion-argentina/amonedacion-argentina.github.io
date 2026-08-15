// Completa metadata faltante (actualmente los datos vienen corregidos de origen)
function completarMetadataFaltante(nft) {
    /*
        Esta función queda disponible para correcciones rápidas sin resubir a IPFS.
        Ejemplo:
        if (nft.id == 100) {
            nft.metadata.attributes.push({ trait_type: 'X', value: 'Y' });
        }
    */
}

// Agrega un timeout al fetch de cada fuente para que intente con otra en caso de demora.
async function fetchConTimeout(url) {
    const controller = new AbortController();
    const timeoutMs = 3000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(url, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json'
            }
        });
    } finally {
        clearTimeout(timeoutId);
    }
}

// Genera el path de la metadata en la cache publicada por GitHub Pages.
function getMetadataCacheUrl(tokenId) {
    return `json/ipfs-cache/${tokenId}.json`;
}

// Obtiene metadata: 1. localStorage 2. ipfs-cache 3. gateways IPFS.
async function getMetadaNFT(nft, elemento) {
    nft.cargandoMetadata = true;

    if (elemento) {
        const spinner = elemento.querySelector('.spinner.pequeno');
        if (spinner) spinner.classList.remove('hidden');
    }

    try {
        const cacheKey = `nft_${App.config.IPFS_HASH}_${nft.id}_metadata`;
        const cachedData = localStorage.getItem(cacheKey);

        if (cachedData) {
            try {
                nft.metadata = JSON.parse(cachedData);
                completarMetadataFaltante(nft);
            } catch (error) {
                console.warn(`Metadata corrupta en localStorage para NFT ${nft.id}.`);
                localStorage.removeItem(cacheKey);
            }
        }

        // Segunda capa: cache publicada en GitHub Pages.
        if (!nft.metadata) {
            try {
                const cacheUrl = getMetadataCacheUrl(nft.id);
                const response = await fetchConTimeout(cacheUrl);

                if (response.ok) {
                    nft.metadata = await response.json();
                    completarMetadataFaltante(nft);
                    localStorage.setItem(cacheKey, JSON.stringify(nft.metadata));
                }
            } catch (error) {
                console.warn(`Cache del sitio no disponible para NFT ${nft.id}:`, error);
            }
        }

        // Tercera capa: gateways IPFS.
        if (!nft.metadata) {
            for (const gateway of App.config.IPFS_GATEWAY) {
                try {
                    const url = `${gateway}${App.config.IPFS_HASH}/${nft.id}`;
                    const response = await fetchConTimeout(url);

                    if (response.ok) {
                        nft.metadata = await response.json();
                        completarMetadataFaltante(nft);
                        localStorage.setItem(cacheKey, JSON.stringify(nft.metadata));
                        break;
                    }
                } catch (error) {
                    console.warn(`Error con gateway ${gateway}:`, error);
                }
            }
        }

        if (!nft.metadata) {
            throw new Error(`No se pudieron obtener los metadatos desde ningún origen del NFT ${nft.id}.`);
        }

        // Reemplaza imagen gris por versión local propia si el NFT es del usuario.
        if (App.estado.walletConectada && nft.enPropiedad) {
            const nuevaUrl = `img/monedas-propias/${nft.id}.webp`;
            const imgElement = elemento?.querySelector('.nft-imagen');
            if (imgElement && imgElement.src !== nuevaUrl) {
                imgElement.src = nuevaUrl;
            }
        }

        if (elemento) {
            actualizarCardNFT(nft, elemento);
        }
    } catch (error) {
        console.error(`Error al obtener los metadatos del NFT ${nft.id}:`, error);
        if (elemento) {
            const nombre = elemento.querySelector('.nft-nombre');
            if (nombre) {
                nombre.textContent = `${App.estado.i18n?.error?.obtenerNFT || 'Error NFT #'}${nft.id}`;
            }
        }
    } finally {
        nft.cargandoMetadata = false;
        if (elemento) {
            const spinner = elemento.querySelector('.spinner.pequeno');
            if (spinner) spinner.classList.add('hidden');
        }
    }
}

// Obtiene la metadata de todos los NFT por lotes.
// Orden: localStorage -> ipfs-cache -> IPFS.
async function precargarMetadatas() {
    const nftsSinMetadata = App.estado.nfts.filter(nft => !nft.metadata);
    const lote = 30;

    for (let i = 0; i < nftsSinMetadata.length; i += lote) {
        const grupo = nftsSinMetadata.slice(i, i + lote);

        await Promise.all(
            grupo.map(async (nft) => {
                const cacheKey = `nft_${App.config.IPFS_HASH}_${nft.id}_metadata`;
                const cachedData = localStorage.getItem(cacheKey);

                if (cachedData) {
                    try {
                        nft.metadata = JSON.parse(cachedData);
                        completarMetadataFaltante(nft);
                        return;
                    } catch (error) {
                        localStorage.removeItem(cacheKey);
                    }
                }

                // Segunda capa: cache publicada en GitHub Pages.
                try {
                    const cacheUrl = getMetadataCacheUrl(nft.id);
                    const response = await fetchConTimeout(cacheUrl);

                    if (response.ok) {
                        nft.metadata = await response.json();
                        completarMetadataFaltante(nft);
                        localStorage.setItem(cacheKey, JSON.stringify(nft.metadata));
                        return;
                    }
                } catch (error) {
                    console.warn(`Cache no disponible para NFT ${nft.id}:`, error);
                }

                // Tercera capa: descarga desde IPFS.
                for (const gateway of App.config.IPFS_GATEWAY) {
                    try {
                        const url = `${gateway}${App.config.IPFS_HASH}/${nft.id}`;
                        const response = await fetchConTimeout(url);

                        if (response.ok) {
                            nft.metadata = await response.json();
                            completarMetadataFaltante(nft);
                            localStorage.setItem(cacheKey, JSON.stringify(nft.metadata));
                            break;
                        }
                    } catch (error) {
                        console.warn(`IPFS error (${gateway}) para NFT ${nft.id}:`, error);
                    }
                }
            })
        );
    }
}

/**
 * Consulta uri(1) del contrato para obtener el IPFS_HASH actualizado.
 */
async function actualizarIpfsHash() {
    try {
        if (!window.ethereum) return;

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contrato = new ethers.Contract(
            App.config.CONTRATO,
            ['function uri(uint256) view returns (string)'],
            provider
        );

        const uriCompleta = await contrato.uri(1);

        if (uriCompleta) {
            let hashLimpio = uriCompleta.replace('ipfs://', '');
            hashLimpio = hashLimpio.split('/')[0];

            if (hashLimpio) {
                App.config.IPFS_HASH = hashLimpio;
                console.log('IPFS_HASH actualizado con éxito:', hashLimpio);
            }
        }
    } catch (error) {
        console.error('Error al actualizar IPFS_HASH:', error);
    }
}

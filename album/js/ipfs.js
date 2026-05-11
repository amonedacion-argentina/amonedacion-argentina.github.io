// Completa metadata faltante
function completarMetadataFaltante(nft) {
        if (nft.id == 50) {
            nft.metadata.attributes.push({
                trait_type: 'CANTO',
                value: '15 e/cm.'
            });
        }

        if (nft.id == 73) {
            nft.metadata.attributes.push({
                trait_type: 'CANTO',
                value: 'Liso'
            });
        }
}

// Obtiene la metadata de un NFT desde IPFS (o desde caché local)
async function getMetadaNFT(nft, elemento) {
    nft.cargandoMetadata = true;
    
    if (elemento) {
        const spinner = elemento.querySelector('.spinner.pequeno');
        if (spinner) spinner.classList.remove('hidden');
    }
    
    try {
        // Verifica caché local primero
        const cacheKey = `nft_${nft.id}_metadata`;
        const cachedData = localStorage.getItem(cacheKey);
        
        if (cachedData) {
            nft.metadata = JSON.parse(cachedData);
            completarMetadataFaltante(nft);
        } else {
            // Intenta con cada gateway hasta tener éxito
            for (const gateway of App.config.IPFS_GATEWAY) {
                try {
                    const url = `${gateway}${App.config.IPFS_HASH}/${nft.id}`;
                    const response = await fetch(url);
                    
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
            
            if (!nft.metadata) {
                throw new Error('No se pudieron obtener los metadatos desde ningún gateway.');
            }
        }

        // Reemplaza imagen gris por versión local propia si el NFT es del usuario
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
            elemento.querySelector('.nft-nombre').textContent = `${App.estado.i18n?.error?.obtenerNFT}${nft.id}`;
        }
    } finally {
        nft.cargandoMetadata = false;
        if (elemento) {
            const spinner = elemento.querySelector('.spinner.pequeno');
            if (spinner) spinner.classList.add('hidden');
        }
    }
}

// Obtiene la metadata de todos los NFT desde IPFS (o desde caché local)
async function precargarMetadatas() {
    const nftsSinMetadata = App.estado.nfts.filter(nft => !nft.metadata);

    const promesas = nftsSinMetadata.map(async (nft) => {
        const cacheKey = `nft_${nft.id}_metadata`;
        const cachedData = localStorage.getItem(cacheKey);

        if (cachedData) {
            nft.metadata = JSON.parse(cachedData);
            completarMetadataFaltante(nft);
            return;
        }

        // Si no hay cache, descarga desde IPFS
        for (const gateway of App.config.IPFS_GATEWAY) {
            try {
                const url = `${gateway}${App.config.IPFS_HASH}/${nft.id}`;
                const response = await fetch(url);

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
    });
    await Promise.all(promesas);
}

/**
 * Consulta la función uri(1) del contrato para obtener el IPFS_HASH actualizado.
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

        // Llama a uri(1) -> devuelve "ipfs://QmesZ4g8n8XebqWtSruhSALCZdVF9WUEtTbvRVxMjmxc76/{id}"
        let uriCompleta = await contrato.uri(1);
        
        if (uriCompleta) {
            // Quita el prefijo 'ipfs://' si existe
            let hashLimpio = uriCompleta.replace('ipfs://', '');
            
            // Quita el sufijo '/{id}' o cualquier cosa que venga después del hash
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
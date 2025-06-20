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
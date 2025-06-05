/*
    Obtiene la metadata desde IPFS (o desde caché local).
    Actualiza el nombre y los atributos del NFT (a través de actualizarCardNFT()).
*/
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
        } else {
            // Intenta con cada gateway hasta tener éxito
            for (const gateway of App.config.IPFS_GATEWAY) {
                try {
                    const url = `${gateway}${App.config.IPFS_HASH}/${nft.id}`;
                    const response = await fetch(url);
                    
                    if (response.ok) {
                        nft.metadata = await response.json();
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
            elemento.querySelector('.nft-nombre').textContent = `Error al obtener el NFT #${nft.id}`;
        }
    } finally {
        nft.cargandoMetadata = false;
        if (elemento) {
            const spinner = elemento.querySelector('.spinner.pequeno');
            if (spinner) spinner.classList.add('hidden');
        }
    }
}
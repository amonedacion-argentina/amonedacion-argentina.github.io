async function cargarMetadatosNFT(nft, elemento) {
    nft.cargandoMetadata = true;
    
    if (elemento) {
        const spinner = elemento.querySelector('.spinner.pequeno');
        if (spinner) spinner.classList.remove('hidden');
    }
    
    try {
        // Verificar caché local primero
        const cacheKey = `nft_${nft.id}_metadata`;
        const cachedData = localStorage.getItem(cacheKey);
        
        if (cachedData) {
            nft.metadata = JSON.parse(cachedData);
        } else {
            // Intentar con cada gateway hasta tener éxito
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
                throw new Error('No se pudieron cargar los metadatos desde ningún gateway');
            }
        }
        
        // Actualizar imagen si el usuario posee el NFT
        if (nft.enPropiedad && nft.metadata.image) {
            const imagenUrl = nft.metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
            if (elemento) {
                const imgElement = elemento.querySelector('.nft-imagen');
                if (imgElement) imgElement.src = imagenUrl;
            }
        }
        
        if (elemento) {
            actualizarCardNFT(nft, elemento);
        }
    } catch (error) {
        console.error(`Error al cargar metadatos para NFT ${nft.id}:`, error);
        if (elemento) {
            elemento.querySelector('.nft-nombre').textContent = `Error al cargar NFT #${nft.id}`;
        }
    } finally {
        nft.cargandoMetadata = false;
        if (elemento) {
            const spinner = elemento.querySelector('.spinner.pequeno');
            if (spinner) spinner.classList.add('hidden');
        }
    }
}
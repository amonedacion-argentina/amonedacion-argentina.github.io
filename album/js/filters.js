function filtrarNFTs() {
    const categoriaSeleccionada = document.getElementById('filtro-categoria').value;
    const mostrarSoloPropios = document.getElementById('filtro-propios').checked;
    
    // Obtiene IDs de la categoría seleccionada
    const idsCategoria = categoriaSeleccionada ? 
        App.estado.categorias[categoriaSeleccionada].ids : 
        App.estado.categorias.todas.ids;
    
    // Filtra NFTs
    App.estado.nftsFiltrados = App.estado.nfts.filter(nft => {
        const enCategoria = idsCategoria.includes(nft.id);
        const cumplePropiedad = !mostrarSoloPropios || nft.enPropiedad;
        return enCategoria && cumplePropiedad;
    });
    
    // Resetear a la primera página
    App.estado.paginaActual = 1;
    actualizarBotonesPaginacion();
    
    // Actualiza contador de NFTs poseídos
    //actualizarUINFTsPoseidos();
}
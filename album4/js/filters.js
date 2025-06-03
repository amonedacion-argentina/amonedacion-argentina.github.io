function filtrarNFTs() {
    const categoriaSeleccionada = document.getElementById('filtro-categoria').value;
    const mostrarSoloPropios = document.getElementById('filtro-propios').checked;
    
    // Obtener IDs de la categoría seleccionada
    const idsCategoria = categoriaSeleccionada ? 
        App.estado.categorias[categoriaSeleccionada].ids : 
        App.estado.categorias.todas.ids;
    
    // Filtrar NFTs
    App.estado.nftsFiltrados = App.estado.nfts.filter(nft => {
        const enCategoria = idsCategoria.includes(nft.id);
        const cumplePropiedad = !mostrarSoloPropios || nft.enPropiedad;
        return enCategoria && cumplePropiedad;
    });
    
    // Resetear a página 1 al filtrar
    App.estado.paginaActual = 1;
    
    // Actualizar estadísticas
    actualizarEstadisticas();
}
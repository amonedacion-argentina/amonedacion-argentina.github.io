function actualizarPaginacion() {
    const totalPaginas = Math.ceil(App.estado.nftsFiltrados.length / App.estado.itemsPorPagina);
    
    // Actualizar botones
    document.getElementById('btn-anterior').disabled = App.estado.paginaActual <= 1;
    document.getElementById('btn-siguiente').disabled = App.estado.paginaActual >= totalPaginas;
    
    // Actualizar indicador de página
    document.getElementById('pagina-actual').textContent = 
        `Página ${App.estado.paginaActual} de ${totalPaginas}`;
}

function cambiarItemsPorPagina(cantidad) {
    App.estado.itemsPorPagina = cantidad;
    App.estado.paginaActual = 1;
    renderizarNFTs();
}
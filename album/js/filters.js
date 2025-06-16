function filtrarNFTs() {
    const categoriaSeleccionada = document.getElementById('filtro-categoria').value;
    const rarezaSeleccionada = document.getElementById('filtro-rareza').value;
    const mostrarSoloPropios = document.getElementById('filtro-propios').checked;

    const idsCategoria = categoriaSeleccionada ?
        App.estado.categorias[categoriaSeleccionada]?.ids || [] :
        App.estado.categorias.todas.ids;

    App.estado.nftsFiltrados = App.estado.nfts.filter(nft => {
        const enCategoria = idsCategoria.includes(nft.id);
        const cumplePropiedad = !mostrarSoloPropios || nft.enPropiedad;

        // Comprobación de rareza
        let cumpleRareza = true;

        if (rarezaSeleccionada !== 'todas') {
            const metadata = nft.metadata;
            if (!metadata || !Array.isArray(metadata.attributes)) {
                cumpleRareza = false; // Si no tiene metadata o attributes, no se puede evaluar
            } else {
                const rarezaAttr = metadata.attributes.find(attr =>
                    (attr.trait_type || '').toUpperCase() === 'RAREZA'
                );
                cumpleRareza = rarezaAttr && (rarezaAttr.value || '').toUpperCase() === rarezaSeleccionada.toUpperCase();
            }
        }

        return enCategoria && cumplePropiedad && cumpleRareza;
    });

    App.estado.paginaActual = 1;
    actualizarBotonesPaginador();
}
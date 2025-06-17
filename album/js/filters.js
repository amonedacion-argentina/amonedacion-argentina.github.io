function filtrarNFTs() {
    const categoriaSeleccionada = document.getElementById('filtro-categoria').value;
    const rarezaSeleccionada = document.getElementById('filtro-rareza').value;
    const anioSeleccionado = document.getElementById('filtro-anio').value;
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

        // Comprobación de año
        let cumpleAnio = true;

        if (anioSeleccionado !== 'todos') {
            const metadata = nft.metadata;
            if (!metadata || !Array.isArray(metadata.attributes)) {
                cumpleAnio = false; // Si no tiene metadata o attributes, no se puede evaluar
            } else {
                const anioAttr = metadata.attributes.find(attr =>
                    (attr.trait_type || '').toUpperCase() === 'AÑO'
                );
                cumpleAnio = anioAttr && (anioAttr.value || '').toUpperCase() === anioSeleccionado.toUpperCase();
            }
        }

        return enCategoria && cumplePropiedad && cumpleRareza && cumpleAnio;
    });

    App.estado.paginaActual = 1;
    actualizarBotonesPaginador();
}
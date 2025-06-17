function filtrarNFTs() {
    const categoriaSeleccionada = document.getElementById('filtro-categoria').value;
    const mostrarSoloPropios = document.getElementById('filtro-propios').checked;

    const idsCategoria = categoriaSeleccionada ?
        App.estado.categorias[categoriaSeleccionada]?.ids || [] :
        App.estado.categorias.todas.ids;

    App.estado.nftsFiltrados = App.estado.nfts.filter(nft => {
        const enCategoria = idsCategoria.includes(nft.id);
        const cumplePropiedad = !mostrarSoloPropios || nft.enPropiedad;

        // Comprobación de rareza
        const rarezaSeleccionada = document.getElementById('filtro-rareza').value;
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
        const anioSeleccionado = document.getElementById('filtro-anio').value;
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

        // Comprobación de composición
        const composicionSeleccionada = document.getElementById('filtro-composicion').value;
        let cumpleComposicion = true;

        if (composicionSeleccionada !== 'todas') {
            const metadata = nft.metadata;
            if (!metadata || !Array.isArray(metadata.attributes)) {
                cumpleComposicion = false; // No hay metadata
            } else {
                const composicionAttr = metadata.attributes.find(attr =>
                    (attr.trait_type || '').toUpperCase() === 'COMPOSICIÓN'
                );
                
                const valorNormalizado = composicionAttr?.value
                    ? normalizarComposicion(composicionAttr.value)
                    : '';

                cumpleComposicion = valorNormalizado === composicionSeleccionada;
            }
        }

        return enCategoria && cumplePropiedad && cumpleRareza && cumpleAnio && cumpleComposicion;
    });

    App.estado.paginaActual = 1;
    actualizarBotonesPaginador();
}
function filtrarNFTs() {
    const categoriaSeleccionada = document.getElementById('filtro-categoria').value;
    const mostrarSoloPropios = document.getElementById('filtro-propios').checked;

    const idsCategoria = categoriaSeleccionada ?
        App.estado.categorias[categoriaSeleccionada]?.ids || [] :
        App.estado.categorias.todas.ids;

    App.estado.nftsFiltrados = App.estado.nfts.filter(nft => {
        const enCategoria = idsCategoria.includes(nft.id);
        const cumplePropiedad = !mostrarSoloPropios || nft.enPropiedad;

        // Comprobación de Rareza
        const rarezaSeleccionada = document.getElementById('filtro-rareza').value;
        let cumpleRareza = true;

        if (rarezaSeleccionada !== 'todas') {
            const metadata = nft.metadata;
            if (!metadata || !Array.isArray(metadata.attributes)) {
                cumpleRareza = false; // Si no tiene metadata o attributes, no se puede evaluar
            } else {
                const rarezaAttr = metadata.attributes.find(attr =>
                    (attr.trait_type || '') === 'RAREZA'
                );
                cumpleRareza = rarezaAttr && (rarezaAttr.value || '').toUpperCase() === rarezaSeleccionada.toUpperCase();
            }
        }

        // Comprobación de Valor
        const valorSeleccionado = document.getElementById('filtro-valor').value;
        let cumpleValor = true;

        if (valorSeleccionado !== 'todos') {
            const metadata = nft.metadata;
            if (!metadata || !metadata.name) {
                cumpleValor = false;
            } else {
                const valor = limpiarNombreDeValor(metadata.name);
                cumpleValor = valor === valorSeleccionado;
            }
        }

        // Comprobación de Año
        const anioSeleccionado = document.getElementById('filtro-anio').value;
        let cumpleAnio = true;

        if (anioSeleccionado !== 'todos') {
            const metadata = nft.metadata;
            if (!metadata || !Array.isArray(metadata.attributes)) {
                cumpleAnio = false; // Si no tiene metadata o attributes, no se puede evaluar
            } else {
                const anioAttr = metadata.attributes.find(attr =>
                    (attr.trait_type || '') === 'AÑO'
                );
                cumpleAnio = anioAttr && (anioAttr.value || '') === anioSeleccionado;
            }
        }

        // Comprobación de Composición
        const composicionSeleccionada = document.getElementById('filtro-composicion').value;
        let cumpleComposicion = true;

        if (composicionSeleccionada !== 'todas') {
            const metadata = nft.metadata;
            if (!metadata || !Array.isArray(metadata.attributes)) {
                cumpleComposicion = false; // No hay metadata
            } else {
                const composicionAttr = metadata.attributes.find(attr =>
                    (attr.trait_type || '') === 'COMPOSICIÓN'
                );
                
                const valorNormalizado = composicionAttr?.value
                    ? normalizarComposicion(composicionAttr.value)
                    : '';

                cumpleComposicion = valorNormalizado === composicionSeleccionada;
            }
        }

        // Comprobación de Alineación
        const alineacionSeleccionada = document.getElementById('filtro-alineacion').value;
        let cumpleAlineacion = true;

        if (alineacionSeleccionada !== 'todas') {
            const metadata = nft.metadata;
            if (!metadata || !Array.isArray(metadata.attributes)) {
                cumpleAlineacion = false; // No hay metadata
            } else {
                const alineacionAttr = metadata.attributes.find(attr =>
                    (attr.trait_type || '') === 'ALINEACIÓN'
                );

                cumpleAlineacion = alineacionAttr && (alineacionAttr.value || '').toUpperCase() === alineacionSeleccionada.toUpperCase();
            }
        }

        // Comprobación de Canto
        const cantoSeleccionado = document.getElementById('filtro-canto').value;
        let cumpleCanto = true;

        if (cantoSeleccionado !== 'todos') {
            const metadata = nft.metadata;
            if (!metadata || !Array.isArray(metadata.attributes)) {
                cumpleCanto = false; // No hay metadata
            } else {
                const cantoAttr = metadata.attributes.find(attr =>
                    (attr.trait_type || '') === 'CANTO'
                );
                
                const valorNormalizado = cantoAttr?.value
                    ? normalizarCanto(cantoAttr.value)
                    : '';

                cumpleCanto = valorNormalizado === cantoSeleccionado;
            }
        }

        // Comprobación de Forma
        const formaSeleccionada = document.getElementById('filtro-forma').value;
        let cumpleForma = true;

        if (formaSeleccionada !== 'todas') {
            const metadata = nft.metadata;
            if (!metadata || !Array.isArray(metadata.attributes)) {
                cumpleForma = false; // No hay metadata
            } else {
                const formaAttr = metadata.attributes.find(attr =>
                    (attr.trait_type || '') === 'FORMA'
                );

                cumpleForma = formaAttr && (formaAttr.value || '').toUpperCase() === formaSeleccionada.toUpperCase();
            }
        }

        // Comprobación de Ceca
        const cecaSeleccionada = document.getElementById('filtro-ceca').value;
        let cumpleCeca = true;

        if (cecaSeleccionada !== 'todas') {
            const metadata = nft.metadata;
            if (!metadata || !Array.isArray(metadata.attributes)) {
                cumpleCeca = false; // No hay metadata
            } else {
                const cecaAttr = metadata.attributes.find(attr =>
                    (attr.trait_type || '') === 'CECA'
                );

                cumpleCeca = cecaAttr && (cecaAttr.value || '').toUpperCase() === cecaSeleccionada.toUpperCase();
            }
        }

        return enCategoria && cumplePropiedad && cumpleRareza && cumpleValor && cumpleAnio && cumpleComposicion && cumpleAlineacion && cumpleCanto && cumpleForma && cumpleCeca;
    });

    App.estado.paginaActual = 1;
    actualizarBotonesPaginador();
}
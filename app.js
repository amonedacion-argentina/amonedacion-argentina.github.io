function displayNFTData(data) {
    document.getElementById('nftName').innerText = data.name;

    // Mostrar la descripción solo si está disponible
    if (data.description) {
        document.getElementById('nftDescription').innerText = data.description;
    } else {
        document.getElementById('nftDescription').innerText = ""; // No mostrar nada si no hay descripción
    }

    // Reemplazar el esquema IPFS en la URL de la imagen
    const imageUrl = data.image.replace("ipfs://", "https://ipfs.io/ipfs/");
    const imageElement = document.getElementById('nftImage');
    imageElement.src = imageUrl;

    const attributesContainer = document.getElementById('nftAttributes');
    attributesContainer.innerHTML = "";
    data.attributes.forEach(attr => {
        const div = document.createElement('div');
        div.innerText = `${attr.trait_type}: ${attr.value}`;
        attributesContainer.appendChild(div);
    });

    document.getElementById('nftData').style.display = 'block';
}

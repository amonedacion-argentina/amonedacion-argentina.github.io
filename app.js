// Dirección del contrato y ABI
const contractAddress = "0x199F5418551DB3aFA002470c11C2f7EbA5154A43";
const abi = [
    "function uri(uint256 tokenId) external view returns (string memory)"
];

// Verificar si MetaMask está instalado
if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    
    // Solicitar al usuario que conecte su cuenta
    async function connectWallet() {
        try {
            await provider.send("eth_requestAccounts", []);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(contractAddress, abi, signer);

            // Llamar a la función para obtener datos de los NFTs con IDs del 1 al 10
            await getNFTData(contract, 1, 10);
        } catch (error) {
            console.error("Error al conectar a MetaMask:", error);
            alert("No se pudo conectar a MetaMask. Asegúrate de que MetaMask esté instalado y configurado.");
        }
    }

    async function getNFTData(contract, startId, count) {
        try {
            const nfts = {}; // Objeto para almacenar grupos de NFTs

            for (let i = startId; i < startId + count; i++) {
                // Obtener el URI del NFT
                const tokenURI = await contract.uri(i);
                
                // Reemplazar {id} por el ID específico (i en este caso)
                const formattedTokenURI = tokenURI.replace("{id}", i.toString());
                console.log("Token URI:", formattedTokenURI); // Esto debe mostrar la URL completa

                // Convertir la URL de IPFS
                const ipfsUrl = formattedTokenURI.replace("ipfs://", "https://ipfs.io/ipfs/");
                
                // Obtener los metadatos desde el URI (IPFS)
                const metadataResponse = await fetch(ipfsUrl);
                const metadata = await metadataResponse.json();
                console.log(metadata);

                // Agrupar las monedas según su AH#
                const ahValue = metadata.attributes.find(attr => attr.trait_type === "AH#").value;

                let groupName = "";
                if (ahValue.startsWith("AR")) {
                    groupName = "Pesos Argentinos";
                } else if (ahValue.startsWith("AU")) {
                    groupName = "Australes";
                } else if (ahValue.startsWith("PS")) {
                    groupName = "Pesos";
                } else if (ahValue.startsWith("MN")) {
                    groupName = "Pesos Moneda Nacional";
                } else if (ahValue.startsWith("PL")) {
                    groupName = "Pesos Ley 18.188";
                }

                // Agregar el NFT al grupo correspondiente
                if (!nfts[groupName]) {
                    nfts[groupName] = [];
                }
                nfts[groupName].push(metadata);
            }

            // Mostrar los NFTs agrupados
            displayGroupedNFTs(nfts);
        } catch (error) {
            console.error("Error al obtener datos:", error);
        }
    }

    function displayGroupedNFTs(nfts) {
        const nftContainer = document.getElementById("nft-container");
        nftContainer.innerHTML = ""; // Limpiar el contenedor

        for (const [group, items] of Object.entries(nfts)) {
            const groupDiv = document.createElement("div");
            const groupHeader = document.createElement("h2");
            groupHeader.textContent = group;
            groupDiv.appendChild(groupHeader);

            items.forEach(item => {
                displayNFT(item, groupDiv);
            });

            nftContainer.appendChild(groupDiv);
        }
    }

    function displayNFT(metadata, container) {
        const nftDiv = document.createElement("div");
        nftDiv.className = "nft";

        const nameElement = document.createElement("h3");
        nameElement.textContent = metadata.name;
        nftDiv.appendChild(nameElement);

        if (metadata.description) {
            const descriptionElement = document.createElement("p");
            descriptionElement.textContent = metadata.description;
            nftDiv.appendChild(descriptionElement);
        }

        // Asegurarse de que la propiedad de imagen exista
        if (metadata.image) {
            // Convertir el URI de IPFS a un formato que funcione en el navegador
            const imageUrl = metadata.image.replace("ipfs://", "https://ipfs.io/ipfs/");
            const imageElement = document.createElement("img");
            imageElement.src = imageUrl; // URL de la imagen
            imageElement.alt = "Imagen del NFT"; // Texto alternativo
            imageElement.style.maxWidth = "200px"; // Estilo opcional para la imagen
            imageElement.style.height = "auto"; // Mantener la relación de aspecto
            nftDiv.appendChild(imageElement);
        } else {
            console.log("No se encontró la propiedad 'image' en los metadatos.");
        }

        // Agregar atributos
        if (metadata.attributes) {
            metadata.attributes.forEach(attr => {
                if (attr.value) {
                    const attrElement = document.createElement("p");
                    attrElement.textContent = `${attr.trait_type}: ${attr.value}`;
                    nftDiv.appendChild(attrElement);
                }
            });
        }

        container.appendChild(nftDiv);
    }

    // Conectar a la cartera al cargar la página
    connectWallet();
} else {
    alert("Por favor, instala MetaMask para continuar.");
}

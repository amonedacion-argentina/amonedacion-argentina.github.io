// Conectar wallet
async function connectWallet() {
    try {
        if (!window.ethereum) {
            alert('Por favor instala MetaMask u otra wallet compatible para conectarte.');
            return;
        }
        
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        if (accounts.length === 0) {
            throw new Error('No se encontraron cuentas conectadas.');
        }
        
        App.state.walletAddress = accounts[0];
        App.state.connected = true;
        
        const shortenedAddress = `${App.state.walletAddress.substring(0, 6)}...${App.state.walletAddress.substring(38)}`;
        const walletElement = document.getElementById('wallet-address');
        walletElement.textContent = shortenedAddress;
        walletElement.style.display = 'inline-block';
        
        document.getElementById('connect-wallet').textContent = 'Wallet Conectada';
        document.getElementById('connect-wallet').disabled = true;
        
        await checkOwnedNFTs();
        
        window.ethereum.on('accountsChanged', (newAccounts) => {
            if (newAccounts.length === 0) {
                disconnectWallet();
            } else {
                App.state.walletAddress = newAccounts[0];
                const shortenedAddress = `${App.state.walletAddress.substring(0, 6)}...${App.state.walletAddress.substring(38)}`;
                document.getElementById('wallet-address').textContent = shortenedAddress;
                checkOwnedNFTs();
            }
        });
        
        window.ethereum.on('chainChanged', () => {
            window.location.reload();
        });
        
    } catch (error) {
        console.error('Error al conectar wallet:', error);
        App.functions.showError(`Error al conectar wallet: ${error.message}`);
    }
}

// Desconectar wallet
function disconnectWallet() {
    App.state.connected = false;
    App.state.walletAddress = null;
    App.state.ownedNFTs = new Set();
    
    document.getElementById('connect-wallet').textContent = 'Conectar Wallet';
    document.getElementById('connect-wallet').disabled = false;
    document.getElementById('wallet-address').style.display = 'none';
    
    App.functions.updateDisplay();
}

// Verificar NFTs poseídos
async function checkOwnedNFTs() {
    if (!App.state.connected || !App.state.walletAddress) return;
    
    try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(
            CONTRACT_ADDRESS,
            [
                'function balanceOf(address account, uint256 id) view returns (uint256)'
            ],
            provider
        );
        
        App.state.ownedNFTs = new Set();
        
        for (const tokenId of App.state.activeNFTs) {
            try {
                const balance = await contract.balanceOf(App.state.walletAddress, tokenId);
                if (balance.gt(0)) {
                    App.state.ownedNFTs.add(tokenId);
                }
            } catch (error) {
                console.error(`Error al verificar balance para token ${tokenId}:`, error);
            }
        }
        
        App.functions.updateStats();
        App.functions.updateDisplay();
        
    } catch (error) {
        console.error('Error al verificar NFTs poseídos:', error);
        App.functions.showError(`Error al verificar NFTs: ${error.message}`);
    }
}
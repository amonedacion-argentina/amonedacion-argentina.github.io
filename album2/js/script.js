// Asignar funciones al objeto global App
App.functions = {
    loadNFTsData: async function() {
        try {
            const response = await fetch('json/nfts.json');
            if (!response.ok) throw new Error('Error al cargar datos de NFTs');
            
            App.state.nftsData = await response.json();
            this.calculateActiveNFTs();
            
            const cachedMetadata = localStorage.getItem('nftMetadataCache');
            if (cachedMetadata) {
                App.state.metadataCache = JSON.parse(cachedMetadata);
            }
        } catch (error) {
            console.error('Error al cargar datos de NFTs:', error);
            this.showError('Error al cargar los datos de la colección. Por favor recarga la página.');
        }
    },

    calculateActiveNFTs: function() {
        if (!App.state.nftsData) return;
        
        const allNFTs = Array.from({length: App.state.nftsData.total}, (_, i) => i + 1);
        App.state.activeNFTs = allNFTs.filter(id => !App.state.nftsData.burned.includes(id));
        App.state.filteredNFTs = [...App.state.activeNFTs];
        
        this.updateStats();
    },

    initControls: function() {
        document.getElementById('connect-wallet').addEventListener('click', connectWallet);
        
        document.getElementById('category-filter').addEventListener('change', (e) => {
            App.state.currentFilter = e.target.value;
            this.applyFilters();
            this.updateDisplay();
        });
        
        document.getElementById('trait-filter').addEventListener('change', (e) => {
            App.state.currentTraitFilter = e.target.value;
            this.applyFilters();
            this.updateDisplay();
        });
        
        document.getElementById('show-owned').addEventListener('click', () => {
            App.state.showOnlyOwned = true;
            this.applyFilters();
            this.updateDisplay();
        });
        
        document.getElementById('show-all').addEventListener('click', () => {
            App.state.showOnlyOwned = false;
            this.applyFilters();
            this.updateDisplay();
        });
        
        document.getElementById('items-per-page').addEventListener('change', (e) => {
            App.state.itemsPerPage = parseInt(e.target.value);
            App.state.currentPage = 1;
            this.updateDisplay();
        });
        
        document.getElementById('items-per-page-bottom').addEventListener('change', (e) => {
            App.state.itemsPerPage = parseInt(e.target.value);
            App.state.currentPage = 1;
            document.getElementById('items-per-page').value = e.target.value;
            this.updateDisplay();
        });
        
        document.getElementById('prev-page').addEventListener('click', () => {
            if (App.state.currentPage > 1) {
                App.state.currentPage--;
                this.updateDisplay();
            }
        });
        
        document.getElementById('next-page').addEventListener('click', () => {
            const maxPage = Math.ceil(App.state.filteredNFTs.length / App.state.itemsPerPage);
            if (App.state.currentPage < maxPage) {
                App.state.currentPage++;
                this.updateDisplay();
            }
        });
        
        document.getElementById('prev-page-bottom').addEventListener('click', () => {
            if (App.state.currentPage > 1) {
                App.state.currentPage--;
                this.updateDisplay();
            }
        });
        
        document.getElementById('next-page-bottom').addEventListener('click', () => {
            const maxPage = Math.ceil(App.state.filteredNFTs.length / App.state.itemsPerPage);
            if (App.state.currentPage < maxPage) {
                App.state.currentPage++;
                this.updateDisplay();
            }
        });
    },

    applyFilters: function() {
        let filtered = [...App.state.activeNFTs];
        
        if (App.state.currentFilter !== 'all') {
            if (App.state.currentFilter === 'proceres') {
                const proceresIds = Object.values(App.state.nftsData.proceres).flat();
                filtered = filtered.filter(id => proceresIds.includes(id));
            } else {
                filtered = filtered.filter(id => App.state.nftsData[App.state.currentFilter].includes(id));
            }
        }
        
        if (App.state.showOnlyOwned) {
            filtered = filtered.filter(id => App.state.ownedNFTs.has(id));
        }
        
        App.state.filteredNFTs = filtered;
        App.state.currentPage = 1;
    },

    updateDisplay: async function() {
        const startIdx = (App.state.currentPage - 1) * App.state.itemsPerPage;
        const endIdx = startIdx + App.state.itemsPerPage;
        const nftsToShow = App.state.filteredNFTs.slice(startIdx, endIdx);
        
        const container = document.getElementById('nfts-container');
        container.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Cargando NFTs...</p>
            </div>
        `;
        
        if (typeof renderNFTs === 'function') {
            await renderNFTs(nftsToShow);
        } else {
            console.error('renderNFTs no está definido');
            container.innerHTML = '<div class="error-message"><p>Error al cargar la función de renderizado</p></div>';
        }
        
        this.updatePaginationControls();
        this.updateStats();
    },

    showError: function(message) {
        const container = document.getElementById('nfts-container');
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
            </div>
        `;
    },

    updatePaginationControls: function() {
        const maxPage = Math.ceil(App.state.filteredNFTs.length / App.state.itemsPerPage);
        
        document.getElementById('page-indicator').textContent = `Página ${App.state.currentPage} de ${maxPage}`;
        document.getElementById('page-indicator-bottom').textContent = `Página ${App.state.currentPage} de ${maxPage}`;
        
        document.getElementById('prev-page').disabled = App.state.currentPage <= 1;
        document.getElementById('prev-page-bottom').disabled = App.state.currentPage <= 1;
        document.getElementById('next-page').disabled = App.state.currentPage >= maxPage;
        document.getElementById('next-page-bottom').disabled = App.state.currentPage >= maxPage;
    },

    updateStats: function() {
        const totalActive = App.state.activeNFTs.length;
        const ownedCount = App.state.ownedNFTs.size;
        const filteredCount = App.state.filteredNFTs.length;
        
        const progressPercent = (ownedCount / totalActive) * 100;
        document.getElementById('collection-progress').style.width = `${progressPercent}%`;
        document.getElementById('progress-text').textContent = `${ownedCount} de ${totalActive} NFTs`;
        
        const categoryStatsElement = document.getElementById('category-stats');
        categoryStatsElement.innerHTML = '';
        
        const addCategoryStat = (categoryName, categoryIds) => {
            const ownedInCategory = categoryIds.filter(id => App.state.ownedNFTs.has(id)).length;
            if (categoryIds.length > 0) {
                const statElement = document.createElement('div');
                statElement.className = 'category-stat';
                statElement.textContent = `${categoryName}: ${ownedInCategory}/${categoryIds.length}`;
                categoryStatsElement.appendChild(statElement);
            }
        };
        
        addCategoryStat('Fútbol', App.state.nftsData.futbol);
        addCategoryStat('Flora', App.state.nftsData.flora);
        addCategoryStat('Fauna', App.state.nftsData.fauna);
        
        for (const [procer, ids] of Object.entries(App.state.nftsData.proceres)) {
            const procerName = procer.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            addCategoryStat(procerName, ids);
        }
    }
};

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    await App.functions.loadNFTsData();
    App.functions.initControls();
    App.functions.updateDisplay();
});
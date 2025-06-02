// Funciones de paginación
function getCurrentPageRange() {
    const startIdx = (App.state.currentPage - 1) * App.state.itemsPerPage;
    const endIdx = startIdx + App.state.itemsPerPage;
    return { startIdx, endIdx };
}

function goToPage(pageNumber) {
    const maxPage = Math.ceil(App.state.filteredNFTs.length / App.state.itemsPerPage);
    if (pageNumber >= 1 && pageNumber <= maxPage) {
        App.state.currentPage = pageNumber;
        App.functions.updateDisplay();
    }
}

function updateItemsPerPage(count) {
    App.state.itemsPerPage = parseInt(count);
    App.state.currentPage = 1;
    App.functions.updateDisplay();
}
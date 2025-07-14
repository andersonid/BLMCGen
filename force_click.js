// Forçar clique no botão + via JavaScript
const addBtn = document.querySelector('.add-tab-btn');
console.log('Botão encontrado:', !!addBtn);
if (addBtn) {
    addBtn.click();
    console.log('Clique executado');
}

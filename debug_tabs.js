// Debug das abas
const container = document.getElementById('codeTabsContainer');
console.log('Container existe:', !!container);
console.log('Classes do container:', container?.className);
console.log('Display do container:', window.getComputedStyle(container)?.display);
console.log('Tab atual:', window.app?.currentTab);

// Forçar aplicação da classe show
if (container) {
    container.classList.add('show');
    console.log('Classe show aplicada');
    console.log('Novas classes:', container.className);
    console.log('Novo display:', window.getComputedStyle(container)?.display);
}

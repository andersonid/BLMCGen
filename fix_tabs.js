// Script para corrigir as abas
const container = document.getElementById('codeTabsContainer');
console.log('Container encontrado:', !!container);
console.log('Classes atuais:', container?.className);

if (container) {
    container.classList.add('show');
    console.log('Classe show adicionada');
    console.log('Novas classes:', container.className);
    
    // Verificar se as abas estão sendo criadas
    const tabs = container.querySelector('.code-tabs');
    console.log('Tabs container:', !!tabs);
    console.log('Conteúdo das abas:', tabs?.innerHTML);
}

// Verificar se o app existe
console.log('App existe:', typeof window.app);
console.log('Abas no app:', window.app?.codeTabs?.size);

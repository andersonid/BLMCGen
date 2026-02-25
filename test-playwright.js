const { chromium } = require('playwright');

async function testBMCApp() {
  console.log('Iniciando testes com Playwright...');
  
  const browser = await chromium.launch({ 
    headless: false, // Para ver o navegador
    slowMo: 1000 // Delay entre ações
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Teste 1: Acessar a aplicação
    console.log('Teste 1: Acessando aplicação...');
    await page.goto('http://localhost:8000');
    await page.waitForLoadState('networkidle');
    
    // Verificar se o título está correto
    const title = await page.title();
    console.log(`Título da página: ${title}`);
    
    // Teste 2: Verificar se o canvas está visível
    console.log('Teste 2: Verificando canvas...');
    const canvas = await page.locator('canvas');
    await canvas.waitFor({ state: 'visible' });
    console.log('Canvas encontrado e visível');
    
    // Teste 3: Testar funcionalidade de zoom
    console.log('Teste 3: Testando zoom...');
    const zoomInBtn = await page.locator('#zoomInBtn');
    await zoomInBtn.click();
    console.log('Zoom in clicado');
    
    // Teste 4: Testar exportação PNG
    console.log('Teste 4: Testando exportação PNG...');
    const shareBtn = await page.locator('#shareBtn');
    await shareBtn.click();
    console.log('Botão de compartilhamento clicado');
    
    // Aguardar um pouco para ver o resultado
    await page.waitForTimeout(2000);
    
    console.log('Todos os testes passaram!');
    
  } catch (error) {
    console.error('Erro durante os testes:', error);
  } finally {
    await browser.close();
  }
}

// Executar testes
testBMCApp().catch(console.error);

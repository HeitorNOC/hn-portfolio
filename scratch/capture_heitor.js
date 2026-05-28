const { chromium } = require('playwright');

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Define o viewport para 1440x960 (proporção perfeita de 3:2)
  await page.setViewportSize({ width: 1440, height: 960 });
  
  try {
    console.log('Navigating to https://www.heitor-negromonte.com.br...');
    await page.goto('https://www.heitor-negromonte.com.br', { waitUntil: 'networkidle', timeout: 30000 });
    
    // Espera 3 segundos para que as animações carreguem e fiquem estáticas
    console.log('Waiting for animations to settle...');
    await page.waitForTimeout(3000);
    
    console.log('Taking screenshot...');
    await page.screenshot({ path: 'assets/images/heitor.png' });
    console.log('Success! Saved to assets/images/heitor.png');
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
  }
})();

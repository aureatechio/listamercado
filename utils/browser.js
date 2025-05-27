const puppeteer = require('puppeteer');

async function launchBrowser() {
  const options = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-extensions',
      '--js-flags="--max-old-space-size=512"',
      '--disable-accelerated-2d-canvas',
      '--disable-canvas-aa',
      '--disable-2d-canvas-clip-aa',
      '--disable-gl-drawing-for-tests'
    ],
    ignoreHTTPSErrors: true,
    dumpio: true // Print browser process stdout and stderr
  };

  try {
    return await puppeteer.launch(options);
  } catch (error) {
    console.error('Erro ao iniciar navegador:', error);
    // Tenta novamente com configurações mínimas
    const minimalOptions = {
      ...options,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-software-rasterizer',
        '--js-flags="--max-old-space-size=256"'
      ]
    };
    
    try {
      return await puppeteer.launch(minimalOptions);
    } catch (retryError) {
      console.error('Erro na segunda tentativa de iniciar navegador:', retryError);
      throw retryError;
    }
  }
}

module.exports = { launchBrowser };

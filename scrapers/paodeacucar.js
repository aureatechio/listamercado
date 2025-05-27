const { launchBrowser } = require('../utils/browser');

async function scrapePaoDeAcucar(term) {
  const browser = await launchBrowser();
  const page = await browser.newPage();

  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'
  );

  await page.goto(`https://www.paodeacucar.com/busca?terms=${encodeURIComponent(term)}`, { waitUntil: 'domcontentloaded', timeout: 60000 });

  try {
    await page.waitForFunction(() => window.products?.length > 0, { timeout: 60000 });
  } catch {
    await browser.close();
    return [];
  }

  const produtos = await page.evaluate(() => {
    return window.products.map(p => ({
      nome: p.name,
      preco: p.variableWeightPrice?.price ?? p.price,
      precoOriginal: p.variableWeightPrice?.priceFrom ?? p.priceFrom ?? null,
      imagem: p.productImages?.[0]
        ? (p.productImages[0].startsWith('http') ? p.productImages[0] : `https://www.paodeacucar.com${p.productImages[0]}`)
        : null,
      url: p.urlDetails,
      concorrente: 'Pão de Açúcar'
    })).filter(p => p.nome !== "");
  });

  await browser.close();
  return produtos;
}

module.exports = scrapePaoDeAcucar;

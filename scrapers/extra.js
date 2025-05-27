const { launchBrowser } = require('../utils/browser');

async function scrapeExtra(term) {
  const browser = await launchBrowser();
  const page = await browser.newPage();

  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'
  );

  await page.goto(`https://www.extramercado.com.br/busca?terms=${encodeURIComponent(term)}`, {
    waitUntil: 'networkidle2',
    timeout: 60000
  });

  try {
    await page.waitForSelector('.Card-sc-yvvqkp-0', { timeout: 60000 });
  } catch {
    await browser.close();
    return [];
  }

  const produtos = await page.$$eval('.Card-sc-yvvqkp-0', cards => {
    return cards.map(card => {
      const nome = card.querySelector('.Title-sc-20azeh-10')?.textContent.trim() || '';
      const precoText = card.querySelector('.PriceValue-sc-20azeh-4')?.textContent.trim() || '';
      const precoOriginalText = card.querySelector('.LineThroughValue-sc-1cty9z3-1')?.textContent.trim() || null;

      const preco = precoText ? parseFloat(precoText.replace('R$', '').replace(',', '.').trim()) : null;
      const precoOriginal = precoOriginalText ? parseFloat(precoOriginalText.replace('R$', '').replace(',', '.').trim()) : null;

      const imagem = card.querySelector('img')?.getAttribute('src') || '';
      const url = card.querySelector('a')?.getAttribute('href') || '';
      const fullUrl = url.startsWith('http') ? url : 'https://www.extramercado.com.br' + url;

      return { nome, preco, precoOriginal, imagem, url: fullUrl, concorrente: 'Extra Supermercado' };
    }).filter(p => p.nome && p.preco !== null && p.preco !== undefined);
  });

  await browser.close();
  return produtos;
}

module.exports = scrapeExtra;

const { launchBrowser } = require('../utils/browser');

async function scrapeFort(term) {
  const browser = await launchBrowser();
  const page = await browser.newPage();

  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'
  );

  await page.goto(`https://www.deliveryfort.com.br/buscar?q=${encodeURIComponent(term)}`, { waitUntil: 'networkidle2', timeout: 60000 });

  try {
    await page.waitForSelector('.shelf-item__title-link', { timeout: 60000 });
  } catch {
    await browser.close();
    return [];
  }

  const produtos = await page.$$eval('ul.main-shelf-list li', items => {
    return items.map(item => {
      const nome = item.querySelector('.shelf-item__title-link')?.textContent.trim() || '';
      const precoText = item.querySelector('.shelf-item__best-price strong')?.textContent.trim() || '';
      const preco = parseFloat(precoText.replace(/[^\d,]/g, '').replace(',', '.')) || 0;

      const imagemRaw = item.querySelector('.shelf-item__img-link img')?.getAttribute('src') || '';
      const imagem = imagemRaw.startsWith('//') ? 'https:' + imagemRaw : imagemRaw;

      const rawLink = item.querySelector('.shelf-item__img-link')?.getAttribute('href') || '';
      const url = rawLink.startsWith('//') ? 'https:' + rawLink : rawLink;

      return { nome, preco, precoOriginal: null, imagem, url, concorrente: 'Fort Supermercado' };
    }).filter(p => p.nome && p.preco !== null && p.preco !== undefined);
  });

  await browser.close();
  return produtos;
}

module.exports = scrapeFort;

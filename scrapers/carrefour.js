const { launchBrowser } = require('../utils/browser');

async function scrapeCarrefour(term) {
  const browser = await launchBrowser();
  const page = await browser.newPage();

  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'
  );

  await page.goto(`https://mercado.carrefour.com.br/busca/${encodeURIComponent(term)}?count=15&sort=price_asc`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('a[data-discover="true"]');

  const produtos = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('a[data-discover="true"]'));

    return items
      .map(card => {
        const nome = card.querySelector('h2')?.innerText || '';
        const precoText = card.querySelector('span.text-base')?.innerText?.replace(/[^\d,]/g, '') || '0';
        const preco = parseFloat(precoText.replace(',', '.')) || 0;
        const imagem = card.querySelector('img')?.src || '';
        const url = 'https://mercado.carrefour.com.br' + card.getAttribute('href');

        return {
          nome,
          preco,
          precoOriginal: null,
          imagem,
          url,
          concorrente: 'Carrefour'
        };
      })
      .filter(p => p.nome && p.preco);
  });

  await browser.close();
  return produtos;
}

module.exports = scrapeCarrefour;

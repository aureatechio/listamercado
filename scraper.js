// scraper.js
const puppeteer = require('puppeteer');

async function scrapeCarrefour() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'
  );

  await page.goto('https://mercado.carrefour.com.br/busca/cafe?count=60', { waitUntil: 'domcontentloaded', timeout: 60000 });
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
          url
        };
      })
      .filter(p => p.nome && p.preco); // filtro adicionado
  });

  await browser.close();
  return produtos;
}

async function scrapePaoDeAcucar() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto('https://www.paodeacucar.com/busca?terms=cafe', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.products?.length > 0);

  const produtos = await page.evaluate(() => {
    return window.products
      .map(p => ({
        nome: p.name,
        preco: p.variableWeightPrice?.price ?? p.price,
        precoOriginal: p.variableWeightPrice?.priceFrom ?? p.priceFrom ?? null,
        imagem: p.productImages?.[0]
          ? (p.productImages[0].startsWith('http') ? p.productImages[0] : `https://www.paodeacucar.com${p.productImages[0]}`)
          : null,
        url: p.urlDetails
      }))
      .filter(p => p.nome && p.preco); // filtro adicionado
  });

  await browser.close();
  return produtos;
}

async function scrapeFort() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  await page.goto('https://www.deliveryfort.com.br/buscar?q=cafe', {
    waitUntil: 'networkidle2'
  });

  try {
    await page.waitForSelector('.shelf-item__title-link', { timeout: 60000 });
  } catch (e) {
    console.warn('Produtos do Fort não carregaram a tempo.');
    await browser.close();
    return [];
  }

  const produtos = await page.$$eval('ul.main-shelf-list li', items => {
    return items
      .map(item => {
        const nome = item.querySelector('.shelf-item__title-link')?.textContent.trim() || '';
        const precoText = item.querySelector('.shelf-item__best-price strong')?.textContent.trim() || '';
        const precoNumerico = parseFloat(precoText.replace(/[^\d,]/g, '').replace(',', '.')) || 0;

        const imagemRaw = item.querySelector('.shelf-item__img-link img')?.getAttribute('src') || '';
        const imagem = imagemRaw.startsWith('//') ? 'https:' + imagemRaw : imagemRaw;

        const rawLink = item.querySelector('.shelf-item__img-link')?.getAttribute('href') || '';
        const url = rawLink.startsWith('//') ? 'https:' + rawLink : rawLink;

        return {
          nome,
          preco: precoNumerico,
          precoOriginal: null,
          imagem,
          url,
          concorrente: 'Fort Supermercados'
        };
      })
      .filter(p => p.nome && p.preco); // já estava presente
  });

  await browser.close();
  return produtos;
}

async function scrapeExtra() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  await page.goto('https://www.extramercado.com.br/busca?terms=cafe', {
    waitUntil: 'networkidle2',
    timeout: 60000
  });

  try {
    await page.waitForSelector('.Card-sc-yvvqkp-0', { timeout: 60000 });
  } catch (e) {
    console.warn('Produtos do Extra não carregaram a tempo.');
    await browser.close();
    return [];
  }

  const produtos = await page.$$eval('.Card-sc-yvvqkp-0', cards => {
    return cards
      .map(card => {
        const nome = card.querySelector('.Title-sc-20azeh-10')?.textContent.trim() || '';
        const precoText = card.querySelector('.PriceValue-sc-20azeh-4')?.textContent.trim() || '';
        const precoOriginalText = card.querySelector('.LineThroughValue-sc-1cty9z3-1')?.textContent.trim() || null;

        const preco = precoText ? parseFloat(precoText.replace('R$', '').replace(',', '.').trim()) : null;
        const precoOriginal = precoOriginalText ? parseFloat(precoOriginalText.replace('R$', '').replace(',', '.').trim()) : null;

        const imagem = card.querySelector('img')?.getAttribute('src') || '';
        const url = card.querySelector('a')?.getAttribute('href') || '';
        const fullUrl = url.startsWith('http') ? url : 'https://www.extramercado.com.br' + url;

        return {
          nome,
          preco,
          precoOriginal,
          imagem,
          url: fullUrl,
          concorrente: 'Extra'
        };
      })
      .filter(p => p.nome && p.preco); // já estava presente
  });

  await browser.close();
  return produtos;
}

async function obterConcorrentes() {
  try {
    const [produtosCarrefour, produtosPaoDeAcucar, produtosFort, produtosExtra] = await Promise.all([
      scrapeCarrefour(),
      scrapePaoDeAcucar(),
      scrapeFort(),
      scrapeExtra()
    ]);

    const todos = [
      ...produtosCarrefour.map(p => ({ ...p, concorrente: 'Carrefour' })),
      ...produtosPaoDeAcucar.map(p => ({ ...p, concorrente: 'Pão de Açúcar' })),
      ...produtosFort.map(p => ({ ...p, concorrente: 'Fort Supermercado' })),
      ...produtosExtra.map(p => ({ ...p, concorrente: 'Extra Supermercado' }))
    ];

    const jsonFinal = { concorrentes: todos };

    console.log(JSON.stringify(jsonFinal, null, 2));
  } catch (error) {
    console.error('Erro ao obter dados dos concorrentes:', error);
  }
}

// Chamada principal
obterConcorrentes();

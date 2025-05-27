const express = require('express');
const app = express();
const PORT = 3000;

const scrapeCarrefour = require('./scrapers/carrefour');
const scrapePaoDeAcucar = require('./scrapers/paodeacucar');
const scrapeFort = require('./scrapers/fort');
const scrapeExtra = require('./scrapers/extra');

app.use(express.json());

app.get('/', async (req, res) => {
  const termo = req.query.produto;
  if (!termo) {
    return res.status(400).json({ erro: 'Informe o nome do produto com o parâmetro ?produto=' });
  }

  try {
    const [carrefour, paoDeAcucar, fort, extra] = await Promise.all([
      scrapeCarrefour(termo),
      scrapePaoDeAcucar(termo),
      scrapeFort(termo),
      scrapeExtra(termo)
    ]);

    const todos = [...carrefour, ...paoDeAcucar, ...fort, ...extra];

    res.json({ concorrentes: todos });
  } catch (error) {
    console.error('Erro ao obter dados dos concorrentes:', error);
    res.status(500).json({ erro: 'Erro ao obter dados dos concorrentes' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});

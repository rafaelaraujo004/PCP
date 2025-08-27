// Backend mínimo com Node/Express para armazenar submissões
// Uso: npm init -y && npm i express cors body-parser && node server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json({limit:'10mb'}));

// Servir PWA estático
app.use(express.static(__dirname));

// Endpoint para armazenar submissões
app.post('/api/submissoes', (req, res) => {
  const dir = path.join(__dirname, 'data');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  const ts = new Date().toISOString().replace(/[:.]/g,'-');
  const file = path.join(dir, `submissao-${ts}.json`);
  fs.writeFileSync(file, JSON.stringify(req.body, null, 2));
  res.json({ok:true, file:path.basename(file)});
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log('Servidor no ar em http://localhost:'+PORT));

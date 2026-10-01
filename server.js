// server.js
// Totem de Check-in com PostgreSQL, segurança, rate limiting, login e gestão de erros.
require('dotenv').config();

const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const pool = require('./db/pool');
const rateLimiter = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');
const { exigirPagina, exigirApi } = require('./middleware/auth');
const checkinRoutes = require('./routes/checkin');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');

const app = express();

// Limite de corpo: reduz abuso por payloads gigantes.
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Arquivos públicos: só a tela de login e assets estáticos ficam aqui.
app.use(express.static('public'));

// Login / logout (públicos).
app.use('/', authRoutes);

// Página inicial: manda direto pro login.
app.get('/', (req, res) => res.redirect('/login.html'));

// Páginas protegidas (fora da pasta public — só acessíveis via estas rotas).
app.get('/admin.html', exigirPagina(['admin']), (req, res) => {
  res.sendFile(path.join(__dirname, 'private', 'admin.html'));
});

app.get('/index.html', exigirPagina(['admin', 'operador']), (req, res) => {
  res.sendFile(path.join(__dirname, 'private', 'index.html'));
});

// API do check-in: exige login (admin ou operador) + rate limiting.
app.use('/checkin', rateLimiter, exigirApi(['admin', 'operador']));
app.use('/', checkinRoutes);

// API de consulta de candidatos: só admin.
app.use('/candidatos', exigirApi(['admin']));
app.use('/', adminRoutes);

app.get('/health', async (req, res, next) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok', banco: 'online', timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

app.use(errorHandler);

const PORTA = process.env.PORT || 3000;
const servidor = app.listen(PORTA, () => {
  console.log(`Totem de check-in rodando na porta ${PORTA}`);
  console.log('Banco: PostgreSQL');
});

async function encerramento() {
  console.log('\nEncerrando servidor...');
  await pool.end();
  servidor.close(() => process.exit(0));
}
process.on('SIGINT', encerramento);
process.on('SIGTERM', encerramento);

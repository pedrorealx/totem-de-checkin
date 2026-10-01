// server.js
// Totem de Check-in com PostgreSQL, segurança, rate limiting e gestão de erros.
require('dotenv').config();

const express = require('express');
const pool = require('./db/pool');
const rateLimiter = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');
const checkinRoutes = require('./routes/checkin');
const adminRoutes = require('./routes/admin');

const app = express();

// Limite de corpo: reduz abuso por payloads gigantes.
app.use(express.json({ limit: '10kb' }));
app.use(express.static('public'));

app.use('/checkin', rateLimiter);
app.use('/', checkinRoutes);
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
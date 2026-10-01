// db/pool.js
// Conexão PostgreSQL centralizada. As consultas da aplicação usam
// parâmetros ($1, $2...) para impedir SQL Injection.
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('[CONFIG] DATABASE_URL não definida. Copie .env.example para .env e configure o PostgreSQL.');
}

const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  // Se PGSSLMODE=require for usado, habilita SSL sem validar certificado.
  ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (err) => {
  console.error('[PG POOL] Erro inesperado no pool:', err.message);
});

module.exports = pool;

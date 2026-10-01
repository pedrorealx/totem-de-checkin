// routes/admin.js
// Tela de consulta: lista os candidatos cadastrados e o status do check-in.
// Mesmo padrão de segurança das outras rotas: consulta 100% parametrizada.

const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

router.get('/candidatos', async (req, res, next) => {
  try {
    const { busca, sala, status } = req.query;

    const condicoes = [];
    const valores = [];

    if (busca && String(busca).trim() !== '') {
      valores.push(`%${String(busca).trim()}%`);
      valores.push(String(busca).replace(/\D/g, ''));
      condicoes.push(`(nome ILIKE $${valores.length - 1} OR cpf = $${valores.length})`);
    }

    if (sala && String(sala).trim() !== '') {
      valores.push(String(sala).trim());
      condicoes.push(`sala = $${valores.length}`);
    }

    if (status === 'feito') {
      condicoes.push('checkin_feito = TRUE');
    } else if (status === 'pendente') {
      condicoes.push('checkin_feito = FALSE');
    }

    const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';

    const resultado = await pool.query(
      `SELECT id, cpf, nome, sala, horario_prova, checkin_feito, checkin_em
       FROM candidatos
       ${where}
       ORDER BY horario_prova ASC, sala ASC, nome ASC`,
      valores
    );

    const resumo = await pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE checkin_feito)::int AS total_checkin,
         COUNT(*) FILTER (WHERE NOT checkin_feito)::int AS total_pendente
       FROM candidatos`
    );

    return res.status(200).json({
      candidatos: resultado.rows,
      resumo: resumo.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
// routes/checkin.js
// PILAR 1: Prevenção de SQL Injection
//
// Toda consulta usa placeholders ($1, $2...). O valor do usuário é
// enviado separadamente pelo driver pg e nunca é concatenado ao SQL.
// NUNCA faça: `... WHERE cpf = '${cpf}'`.

const express = require('express');
const pool = require('../db/pool');
const { ErroDeNegocio } = require('../middleware/errorHandler');

const router = express.Router();

function cpfValido(cpf) {
  return typeof cpf === 'string' && /^\d{11}$/.test(cpf);
}

router.post('/checkin', async (req, res, next) => {
  try {
    const { cpf } = req.body || {};

    if (!cpfValido(cpf)) {
      throw new ErroDeNegocio(
        'CPF inválido. Confira os 11 dígitos e tente novamente.',
        400,
        'CPF_INVALIDO'
      );
    }

    // PILAR 1: consulta parametrizada.
    const resultadoCandidato = await pool.query(
      `SELECT id, nome, sala, horario_prova, checkin_feito
       FROM candidatos
       WHERE cpf = $1`,
      [cpf]
    );

    if (resultadoCandidato.rowCount === 0) {
      throw new ErroDeNegocio(
        'Inscrição não encontrada. Procure um fiscal para verificar seus dados.',
        404,
        'CANDIDATO_NAO_ENCONTRADO'
      );
    }

    const candidato = resultadoCandidato.rows[0];

    if (candidato.checkin_feito) {
      throw new ErroDeNegocio(
        'Check-in já realizado anteriormente para esta inscrição.',
        409,
        'CHECKIN_DUPLICADO'
      );
    }

    // Atualização parametrizada e atômica: só marca se ainda estiver falso.
    const atualizacao = await pool.query(
      `UPDATE candidatos
       SET checkin_feito = TRUE, checkin_em = NOW()
       WHERE id = $1 AND checkin_feito = FALSE
       RETURNING nome, sala, horario_prova`,
      [candidato.id]
    );

    // Evita dupla confirmação quando duas requisições chegam quase juntas.
    if (atualizacao.rowCount === 0) {
      throw new ErroDeNegocio(
        'Check-in já realizado anteriormente para esta inscrição.',
        409,
        'CHECKIN_DUPLICADO'
      );
    }

    const confirmado = atualizacao.rows[0];

    return res.status(200).json({
      mensagem: 'Check-in confirmado com sucesso.',
      candidato: {
        nome: confirmado.nome,
        sala: confirmado.sala,
        horario_prova: confirmado.horario_prova,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

// routes/checkin.js
// Confirmação de presença via CPF.
// O CPF completo é usado apenas no Back-End para localizar o candidato.
// O CPF nunca é devolvido completo para o Front-End.

const express = require('express');
const pool = require('../db/pool');
const { ErroDeNegocio } = require('../middleware/errorHandler');

const router = express.Router();

function mascararCPF(cpf) {
  const valor = String(cpf || '');

  if (valor.length !== 11) {
    return 'CPF mascarado';
  }

  // Ex.: 10466735480 -> 104.***.***-80
  return `${valor.slice(0, 3)}.***.***-${valor.slice(-2)}`;
}

router.post('/checkin', async (req, res, next) => {
  try {
    const { cpf } = req.body || {};

    if (!cpf || typeof cpf !== 'string' || !/^\d{11}$/.test(cpf)) {
      throw new ErroDeNegocio(
        'CPF inválido. Digite os 11 números do CPF.',
        400,
        'CPF_INVALIDO'
      );
    }

    const resultado = await pool.query(
      `SELECT
         id,
         cpf,
         nome,
         sala,
         horario_prova,
         checkin_feito
       FROM candidatos
       WHERE cpf = $1`,
      [cpf]
    );

    if (resultado.rows.length === 0) {
      throw new ErroDeNegocio(
        'CPF não encontrado na lista de candidatos. Procure um fiscal.',
        404,
        'CANDIDATO_NAO_ENCONTRADO'
      );
    }

    const candidato = resultado.rows[0];

    if (candidato.checkin_feito) {
      throw new ErroDeNegocio(
        'Check-in já havia sido confirmado anteriormente para este CPF.',
        409,
        'CHECKIN_JA_FEITO'
      );
    }

    // Atualização atômica: evita que duas requisições simultâneas
    // confirmem o mesmo candidato.
    const atualizado = await pool.query(
      `UPDATE candidatos
       SET
         checkin_feito = TRUE,
         checkin_em = NOW()
       WHERE id = $1
         AND checkin_feito = FALSE
       RETURNING
         id,
         cpf,
         nome,
         sala,
         horario_prova,
         checkin_em`,
      [candidato.id]
    );

    if (atualizado.rows.length === 0) {
      throw new ErroDeNegocio(
        'Check-in já havia sido confirmado anteriormente para este CPF.',
        409,
        'CHECKIN_JA_FEITO'
      );
    }

    const candidatoAtualizado = atualizado.rows[0];

    // Mascaramento: o CPF completo permanece somente no Back-End/BD.
    const candidatoSeguro = {
      id: candidatoAtualizado.id,
      cpf: mascararCPF(candidatoAtualizado.cpf),
      nome: candidatoAtualizado.nome,
      sala: candidatoAtualizado.sala,
      horario_prova: candidatoAtualizado.horario_prova,
      checkin_em: candidatoAtualizado.checkin_em
    };

    return res.status(200).json({
      candidato: candidatoSeguro
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

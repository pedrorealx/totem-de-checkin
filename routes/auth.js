// routes/auth.js
// Login e logout.
// Senhas nunca ficam em texto puro: comparação via bcrypt.
// Falhas de login são registradas no terminal sem registrar a senha ou o hash.

const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const { emitirToken, NOME_COOKIE } = require('../middleware/auth');

const router = express.Router();

const DESTINO_POR_PAPEL = {
  admin: '/admin.html',
  operador: '/index.html',
};

function registrarFalhaLogin(req, usuario, motivo) {
  console.warn('[LOGIN INVÁLIDO]', {
    timestamp: new Date().toISOString(),
    usuario: usuario || null,
    motivo,
    ip: req.ip,
  });
}

router.post('/login', async (req, res, next) => {
  try {
    const { usuario, senha } = req.body || {};
    const usuarioNormalizado =
      typeof usuario === 'string' ? usuario.trim().toLowerCase() : '';

    if (
      !usuarioNormalizado ||
      !senha ||
      senha.length < 6 ||
      senha.length > 72
    ) {
      registrarFalhaLogin(req, usuarioNormalizado, 'dados inválidos');

      return res.status(400).json({
        erro: 'DADOS_INVALIDOS',
        mensagem: 'Informe usuário e senha válidos.',
      });
    }

    const resultado = await pool.query(
      `SELECT id, usuario, senha_hash, papel
       FROM usuarios
       WHERE usuario = $1`,
      [usuarioNormalizado]
    );

    if (resultado.rows.length === 0) {
      registrarFalhaLogin(req, usuarioNormalizado, 'usuário não encontrado');

      return res.status(401).json({
        erro: 'CREDENCIAIS_INVALIDAS',
        mensagem: 'Usuário ou senha incorretos.',
      });
    }

    const registro = resultado.rows[0];

    const senhaConfere = await bcrypt.compare(
      senha,
      registro.senha_hash
    );

    if (!senhaConfere) {
      registrarFalhaLogin(req, usuarioNormalizado, 'senha incorreta');

      return res.status(401).json({
        erro: 'CREDENCIAIS_INVALIDAS',
        mensagem: 'Usuário ou senha incorretos.',
      });
    }

    console.log('[LOGIN OK]', {
      timestamp: new Date().toISOString(),
      usuario: registro.usuario,
      papel: registro.papel,
      ip: req.ip,
    });

    const token = emitirToken({
      id: registro.id,
      usuario: registro.usuario,
      papel: registro.papel,
    });

    res.cookie(NOME_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 12 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      papel: registro.papel,
      redirecionar:
        DESTINO_POR_PAPEL[registro.papel] || '/login.html',
    });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie(NOME_COOKIE);

  return res.status(200).json({
    mensagem: 'Sessão encerrada.',
  });
});

module.exports = router;

// middleware/auth.js
// Autenticação via JWT guardado em cookie httpOnly.
// Sem sessão em memória: funciona bem em ambientes serverless (Vercel).

const jwt = require('jsonwebtoken');

const SEGREDO = process.env.JWT_SECRET;
const NOME_COOKIE = 'totem_token';

if (!SEGREDO) {
  console.error('[CONFIG] JWT_SECRET não definida. Defina uma string longa e aleatória no .env / nas variáveis do Vercel.');
}

function emitirToken(usuario) {
  return jwt.sign(
    { id: usuario.id, usuario: usuario.usuario, papel: usuario.papel },
    SEGREDO,
    { expiresIn: '12h' }
  );
}

function lerUsuarioDoCookie(req) {
  const token = req.cookies && req.cookies[NOME_COOKIE];
  if (!token) return null;
  try {
    return jwt.verify(token, SEGREDO);
  } catch (err) {
    return null;
  }
}

// Protege PÁGINAS HTML: sem login válido, redireciona para /login.html.
function exigirPagina(papeisPermitidos) {
  return (req, res, next) => {
    const usuario = lerUsuarioDoCookie(req);
    if (!usuario || !papeisPermitidos.includes(usuario.papel)) {
      return res.redirect('/login.html');
    }
    req.usuario = usuario;
    next();
  };
}

// Protege ROTAS DE API (JSON): sem login válido, responde 401 em JSON.
function exigirApi(papeisPermitidos) {
  return (req, res, next) => {
    const usuario = lerUsuarioDoCookie(req);
    if (!usuario || !papeisPermitidos.includes(usuario.papel)) {
      return res.status(401).json({
        erro: 'NAO_AUTENTICADO',
        mensagem: 'Sessão expirada ou inválida. Faça login novamente.',
      });
    }
    req.usuario = usuario;
    next();
  };
}

module.exports = { emitirToken, lerUsuarioDoCookie, exigirPagina, exigirApi, NOME_COOKIE };

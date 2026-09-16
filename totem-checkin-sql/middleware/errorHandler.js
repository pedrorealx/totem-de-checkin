// middleware/errorHandler.js
// PILAR 2: Gestão de erros no servidor.
// O usuário recebe mensagens seguras; detalhes técnicos ficam no log.

class ErroDeNegocio extends Error {
  constructor(mensagemUsuario, codigoHttp = 400, codigoErro = 'ERRO_NEGOCIO') {
    super(mensagemUsuario);
    this.name = 'ErroDeNegocio';
    this.mensagemUsuario = mensagemUsuario;
    this.codigoHttp = codigoHttp;
    this.codigoErro = codigoErro;
  }
}

function logTecnico(err, req) {
  console.error('[ERRO SERVIDOR]', {
    timestamp: new Date().toISOString(),
    totemId: req.headers['x-totem-id'] || null,
    rota: req.originalUrl,
    metodo: req.method,
    mensagem: err.message,
    stack: err.stack,
  });
}

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  logTecnico(err, req);

  if (err instanceof ErroDeNegocio) {
    return res.status(err.codigoHttp).json({
      erro: err.codigoErro,
      mensagem: err.mensagemUsuario,
    });
  }

  // PostgreSQL indisponível, queda de rede, timeout ou conexão recusada.
  if (['ECONNREFUSED', 'ETIMEDOUT', '57P03', '08000', '08003', '08006', '08001'].includes(err.code)) {
    return res.status(503).json({
      erro: 'SERVICO_INDISPONIVEL',
      mensagem: 'Não foi possível confirmar seu check-in no momento. Verifique a conexão ou procure um fiscal.',
    });
  }

  // JSON malformado / corpo inválido.
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      erro: 'JSON_INVALIDO',
      mensagem: 'Dados enviados em formato inválido.',
    });
  }

  return res.status(500).json({
    erro: 'ERRO_INTERNO',
    mensagem: 'Ocorreu um problema ao processar seu check-in. Procure um fiscal.',
  });
}

module.exports = { errorHandler, ErroDeNegocio };

// middleware/rateLimiter.js
// PILAR 3: Limite de requisições.
// 3 tentativas por minuto por totem; ao exceder, bloqueia por 60s.

const JANELA_MS = 60 * 1000;
const LIMITE_TENTATIVAS = 3;
const BLOQUEIO_MS = 60 * 1000;
const registros = new Map();

function rateLimiter(req, res, next) {
  const totemId = req.headers['x-totem-id'] || req.ip;
  const agora = Date.now();
  let registro = registros.get(totemId);

  if (!registro) {
    registro = { tentativas: 0, inicioJanela: agora, bloqueadoAte: null };
    registros.set(totemId, registro);
  }

  if (registro.bloqueadoAte && agora < registro.bloqueadoAte) {
    const segundos = Math.ceil((registro.bloqueadoAte - agora) / 1000);
    res.set('Retry-After', String(segundos));
    return res.status(429).json({
      erro: 'MUITAS_TENTATIVAS',
      mensagem: `Muitas tentativas neste totem. Tente novamente em ${segundos}s ou procure um fiscal.`,
    });
  }

  if (agora - registro.inicioJanela >= JANELA_MS) {
    registro.tentativas = 0;
    registro.inicioJanela = agora;
    registro.bloqueadoAte = null;
  }

  registro.tentativas += 1;

  if (registro.tentativas > LIMITE_TENTATIVAS) {
    registro.bloqueadoAte = agora + BLOQUEIO_MS;
    const segundos = Math.ceil(BLOQUEIO_MS / 1000);
    res.set('Retry-After', String(segundos));
    console.warn('[RATE LIMIT] Totem bloqueado', {
      timestamp: new Date().toISOString(),
      totemId,
      tentativas: registro.tentativas,
    });
    return res.status(429).json({
      erro: 'MUITAS_TENTATIVAS',
      mensagem: `Muitas tentativas neste totem. Tente novamente em ${segundos}s ou procure um fiscal.`,
    });
  }

  next();
}

setInterval(() => {
  const agora = Date.now();
  for (const [chave, registro] of registros.entries()) {
    if (agora - registro.inicioJanela >= JANELA_MS && (!registro.bloqueadoAte || agora > registro.bloqueadoAte)) {
      registros.delete(chave);
    }
  }
}, 5 * 60 * 1000).unref();

module.exports = rateLimiter;

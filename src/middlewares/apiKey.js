// Exige el header x-api-key. Si falta o es incorrecta, responde 401.
const crypto = require('crypto');
const env = require('../config/env');

function apiKey(req, res, next) {
  const recibida = Buffer.from(req.get('x-api-key') || '');
  const esperada = Buffer.from(env.apiKey);
  // timingSafeEqual compara sin filtrar información por tiempo de respuesta
  const valida = recibida.length === esperada.length && crypto.timingSafeEqual(recibida, esperada);

  if (!valida) {
    return res.status(401).json({ error: 'API key faltante o incorrecta' });
  }
  next();
}

module.exports = apiKey;

// Validaciones de entrada. Si algo está mal, responde 400 con el detalle.
const {
  CANALES, ESTADOS, CATEGORIAS, URGENCIAS, MAX_MENSAJE, MAX_NOMBRE,
} = require('../config/constantes');

const esTexto = (valor) => typeof valor === 'string' && valor.trim().length > 0;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function responder400(res, detalles) {
  return res.status(400).json({ error: 'Datos inválidos', detalles });
}

function validarCrear(req, res, next) {
  const body = req.body || {};
  const errores = [];

  if (!esTexto(body.externalId)) errores.push('externalId es obligatorio (texto)');

  if (!esTexto(body.nombre)) errores.push('nombre es obligatorio (texto)');
  else if (body.nombre.trim().length > MAX_NOMBRE) errores.push(`nombre: máximo ${MAX_NOMBRE} caracteres`);

  if (body.email !== undefined && body.email !== '' && !(esTexto(body.email) && EMAIL_REGEX.test(body.email.trim()))) {
    errores.push('email no tiene un formato válido');
  }

  if (!CANALES.includes(body.canal)) errores.push(`canal debe ser uno de: ${CANALES.join(', ')}`);

  if (!esTexto(body.mensaje)) errores.push('mensaje es obligatorio (texto)');
  else if (body.mensaje.trim().length > MAX_MENSAJE) errores.push(`mensaje: máximo ${MAX_MENSAJE} caracteres`);

  if (errores.length > 0) return responder400(res, errores);
  next();
}

function validarId(req, res, next) {
  if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
    return responder400(res, ['el id no es válido']);
  }
  next();
}

function validarEstado(req, res, next) {
  const estado = (req.body || {}).estado;
  if (!ESTADOS.includes(estado)) {
    return responder400(res, [`estado debe ser uno de: ${ESTADOS.join(', ')}`]);
  }
  next();
}

function validarFiltros(req, res, next) {
  const { estado, urgencia, categoria, limit } = req.query;
  const errores = [];

  if (estado !== undefined && !ESTADOS.includes(estado)) errores.push(`estado debe ser uno de: ${ESTADOS.join(', ')}`);
  if (urgencia !== undefined && !URGENCIAS.includes(urgencia)) errores.push(`urgencia debe ser una de: ${URGENCIAS.join(', ')}`);
  if (categoria !== undefined && !CATEGORIAS.includes(categoria)) errores.push(`categoria debe ser una de: ${CATEGORIAS.join(', ')}`);
  if (limit !== undefined && !(Number.isInteger(Number(limit)) && Number(limit) > 0)) errores.push('limit debe ser un entero mayor a 0');

  if (errores.length > 0) return responder400(res, errores);
  next();
}

module.exports = { validarCrear, validarId, validarEstado, validarFiltros };

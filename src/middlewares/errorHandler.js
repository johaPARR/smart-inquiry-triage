// Manejo central de errores y rutas inexistentes.
function noEncontrada(req, res) {
  res.status(404).json({ error: 'Ruta no encontrada' });
}

// Express reconoce un manejador de errores por tener 4 parámetros
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo no es un JSON válido' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'El cuerpo es demasiado grande' });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Datos inválidos', detalles: Object.values(err.errors).map((e) => e.message) });
  }
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
}

module.exports = { noEncontrada, errorHandler };

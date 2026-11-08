// Lógica de los endpoints de /api/consultas.
const Consulta = require('../models/Consulta');
const { clasificar } = require('../services/ai.service');

// POST /api/consultas -> guarda, clasifica y devuelve la consulta
async function crear(req, res) {
  const { nombre, email, canal, mensaje } = req.body;
  const externalId = req.body.externalId.trim();

  // Idempotencia: si ya existe ese externalId, devolvemos la existente (200)
  const existente = await Consulta.findOne({ externalId });
  if (existente) return res.status(200).json(existente);

  let consulta;
  try {
    consulta = await Consulta.create({ externalId, nombre, email: email || undefined, canal, mensaje });
  } catch (err) {
    // Dos pedidos iguales casi al mismo tiempo: el índice único frena al segundo
    if (err.code === 11000) {
      const duplicada = await Consulta.findOne({ externalId });
      if (duplicada) return res.status(200).json(duplicada);
    }
    throw err;
  }

  let clasificacion;
  try {
    clasificacion = await clasificar({ nombre: consulta.nombre, canal: consulta.canal, mensaje: consulta.mensaje });
  } catch (err) {
    // La IA falló: la consulta NO se pierde, queda en estado "error"
    consulta.estado = 'error';
    consulta.errorDetalle = err.message;
    await consulta.save();
    return res.status(502).json({ error: 'Falló la clasificación con IA', consulta });
  }

  consulta.clasificacion = clasificacion;
  consulta.estado = 'clasificada';
  await consulta.save();
  return res.status(201).json(consulta);
}

// GET /api/consultas?estado=&urgencia=&categoria=&limit=
async function listar(req, res) {
  const { estado, urgencia, categoria } = req.query;
  const filtro = {};
  if (estado) filtro.estado = estado;
  if (urgencia) filtro['clasificacion.urgencia'] = urgencia;
  if (categoria) filtro['clasificacion.categoria'] = categoria;

  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const consultas = await Consulta.find(filtro).sort({ createdAt: -1 }).limit(limit);
  res.json({ cantidad: consultas.length, consultas });
}

// GET /api/consultas/:id
async function obtener(req, res) {
  const consulta = await Consulta.findById(req.params.id);
  if (!consulta) return res.status(404).json({ error: 'Consulta no encontrada' });
  res.json(consulta);
}

// PATCH /api/consultas/:id  body: { "estado": "notificada" }
async function actualizarEstado(req, res) {
  const consulta = await Consulta.findByIdAndUpdate(
    req.params.id,
    { estado: req.body.estado },
    { new: true, runValidators: true }
  );
  if (!consulta) return res.status(404).json({ error: 'Consulta no encontrada' });
  res.json(consulta);
}

module.exports = { crear, listar, obtener, actualizarEstado };

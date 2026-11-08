// Lógica de los endpoints de /api/consultas.
const Consulta = require('../models/Consulta');
const { clasificar } = require('../services/ai.service');

// Clasifica una consulta ya guardada y actualiza su estado.
// Devuelve true si salió bien. Si la IA falla, la consulta queda en "error" (no se pierde).
async function clasificarYGuardar(consulta) {
  let clasificacion;
  try {
    clasificacion = await clasificar({ nombre: consulta.nombre, canal: consulta.canal, mensaje: consulta.mensaje });
  } catch (err) {
    consulta.estado = 'error';
    consulta.errorDetalle = err.message;
    await consulta.save();
    return false;
  }

  consulta.clasificacion = clasificacion;
  consulta.estado = 'clasificada';
  consulta.errorDetalle = undefined; // limpia el error de un intento anterior
  await consulta.save();
  return true;
}

// POST /api/consultas -> guarda, clasifica y devuelve la consulta
async function crear(req, res) {
  const { nombre, email, canal, mensaje } = req.body;
  const externalId = req.body.externalId.trim();

  const existente = await Consulta.findOne({ externalId });
  if (existente) {
    // Idempotencia: si ya existe ese externalId, devolvemos la existente (200)...
    if (existente.estado !== 'error') return res.status(200).json(existente);

    // ...salvo que haya quedado en "error": en ese caso se reintenta la clasificación
    const ok = await clasificarYGuardar(existente);
    if (!ok) return res.status(502).json({ error: 'Falló la clasificación con IA', consulta: existente });
    return res.status(200).json(existente);
  }

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

  const ok = await clasificarYGuardar(consulta);
  if (!ok) return res.status(502).json({ error: 'Falló la clasificación con IA', consulta });
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

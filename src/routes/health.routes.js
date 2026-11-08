const { Router } = require('express');
const mongoose = require('mongoose');

const router = Router();

// GET /api/health (sin API key): verifica que la API y Mongo responden
router.get('/', (req, res) => {
  const mongoOk = mongoose.connection.readyState === 1; // 1 = conectado
  res.status(mongoOk ? 200 : 503).json({
    status: mongoOk ? 'ok' : 'error',
    api: 'ok',
    mongo: mongoOk ? 'conectado' : 'desconectado',
  });
});

module.exports = router;

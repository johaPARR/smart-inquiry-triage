// Arma la app de Express. No hace listen(): así los tests pueden importarla.
const express = require('express');
const healthRoutes = require('./routes/health.routes');
const consultasRoutes = require('./routes/consultas.routes');
const { noEncontrada, errorHandler } = require('./middlewares/errorHandler');

const app = express();

app.use(express.json({ limit: '10kb' }));

app.use('/api/health', healthRoutes);
app.use('/api/consultas', consultasRoutes);

app.use(noEncontrada);
app.use(errorHandler);

module.exports = app;

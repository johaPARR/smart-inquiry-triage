// Conexión a MongoDB con Mongoose.
const mongoose = require('mongoose');
const env = require('./env');

async function conectarDB() {
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
  console.log('MongoDB conectado');
}

module.exports = { conectarDB };

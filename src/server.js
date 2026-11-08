// Punto de entrada: conecta a MongoDB y levanta el servidor.
const app = require('./app');
const env = require('./config/env');
const { conectarDB } = require('./config/db');

async function iniciar() {
  try {
    await conectarDB();
    app.listen(env.port, () => {
      console.log(`API escuchando en http://localhost:${env.port} (IA: ${env.aiMode})`);
    });
  } catch (err) {
    console.error('No se pudo iniciar el servidor:', err.message);
    process.exit(1);
  }
}

iniciar();

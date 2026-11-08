// Punto de entrada: conecta a MongoDB y levanta el servidor.
const app = require('./app');
const env = require('./config/env');
const { conectarDB } = require('./config/db');

async function iniciar() {
  try {
    await conectarDB();
    // En Express 5 el callback de listen recibe el error si no se pudo abrir el puerto
    app.listen(env.port, (error) => {
      if (error) {
        const motivo = error.code === 'EADDRINUSE'
          ? `el puerto ${env.port} ya está en uso (¿hay otra terminal con el servidor corriendo?)`
          : error.message;
        console.error(`No se pudo iniciar el servidor: ${motivo}`);
        process.exit(1);
      }
      console.log(`API escuchando en http://localhost:${env.port} (IA: ${env.aiMode})`);
    });
  } catch (err) {
    console.error('No se pudo iniciar el servidor:', err.message);
    process.exit(1);
  }
}

iniciar();

// Carga las variables del archivo .env y valida que estén las obligatorias.
const dotenv = require('dotenv');

dotenv.config({ quiet: true });

const faltantes = ['MONGO_URI', 'API_KEY'].filter((nombre) => !process.env[nombre]);
if (faltantes.length > 0) {
  throw new Error(`Faltan variables de entorno: ${faltantes.join(', ')}`);
}

const aiMode = (process.env.AI_MODE || 'mock').toLowerCase();
if (!['mock', 'openai'].includes(aiMode)) {
  throw new Error('AI_MODE debe ser "mock" o "openai"');
}

module.exports = {
  port: Number(process.env.PORT) || 3000,
  mongoUri: process.env.MONGO_URI,
  apiKey: process.env.API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || '',
  aiMode,
};

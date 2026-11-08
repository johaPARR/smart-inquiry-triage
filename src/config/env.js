// Carga las variables del archivo .env y valida que estén las obligatorias.
const dotenv = require('dotenv');

dotenv.config({ quiet: true });

const faltantes = ['MONGO_URI', 'API_KEY'].filter((nombre) => !process.env[nombre]);
if (faltantes.length > 0) {
  throw new Error(`Faltan variables de entorno: ${faltantes.join(', ')}`);
}

const aiMode = (process.env.AI_MODE || 'mock').toLowerCase();
if (!['mock', 'gemini'].includes(aiMode)) {
  throw new Error('AI_MODE debe ser "mock" o "gemini"');
}

const geminiApiKey = process.env.GEMINI_API_KEY || '';
const geminiModel = process.env.GEMINI_MODEL || '';

// Si se elige Gemini, fallamos al arrancar (y no recién en la primera consulta)
if (aiMode === 'gemini' && (!geminiApiKey || !geminiModel)) {
  throw new Error('Con AI_MODE=gemini hay que completar GEMINI_API_KEY y GEMINI_MODEL en el .env');
}

module.exports = {
  port: Number(process.env.PORT) || 3000,
  mongoUri: process.env.MONGO_URI,
  apiKey: process.env.API_KEY,
  aiMode,
  geminiApiKey,
  geminiModel,
  // Pausa base entre reintentos a Gemini (ms). En los tests se pone en 0.
  geminiRetryMs: process.env.GEMINI_RETRY_MS !== undefined ? Number(process.env.GEMINI_RETRY_MS) : 1500,
};

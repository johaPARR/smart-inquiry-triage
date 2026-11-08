// Servicio de clasificación. En la etapa 2 solo funciona el modo "mock"
// (reglas por palabras clave, sin costo ni internet).
// En la etapa 3 se completa clasificarConOpenAI() y se usa AI_MODE=openai.
const env = require('../config/env');

// Pasa a minúsculas y saca tildes para comparar fácil ("cobró" -> "cobro")
const normalizar = (texto) => texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const contiene = (texto, palabras) => palabras.some((p) => texto.includes(p));

const RESPUESTAS = {
  ventas: 'Hola {nombre}, gracias por tu interés. Un asesor comercial te va a contactar para darte los detalles.',
  soporte: 'Hola {nombre}, lamentamos el inconveniente. Nuestro equipo de soporte ya lo está revisando y te escribe a la brevedad.',
  facturacion: 'Hola {nombre}, lamentamos el inconveniente. Ya estamos revisando tu caso de facturación y te confirmamos a la brevedad.',
  reclamo: 'Hola {nombre}, lamentamos lo ocurrido. Tomamos tu reclamo con seriedad y un responsable se va a comunicar con vos.',
  otro: 'Hola {nombre}, gracias por escribirnos. Recibimos tu consulta y te respondemos a la brevedad.',
};

function clasificarMock({ nombre, mensaje }) {
  const texto = normalizar(mensaje);

  let categoria = 'otro';
  if (contiene(texto, ['reclamo', 'queja', 'inaceptable', 'pesimo', 'mal servicio', 'denuncia'])) categoria = 'reclamo';
  else if (contiene(texto, ['cobr', 'factura', 'reembolso', 'pago', 'tarjeta', 'devolucion'])) categoria = 'facturacion';
  else if (contiene(texto, ['no funciona', 'error', 'falla', 'problema', 'no puedo', 'ayuda', 'se cayo'])) categoria = 'soporte';
  else if (contiene(texto, ['precio', 'comprar', 'cotiza', 'presupuesto', 'plan', 'demo', 'contratar'])) categoria = 'ventas';

  let urgencia = 'baja';
  if (contiene(texto, ['urgente', 'hoy', 'inmediat', 'ya mismo', 'cuanto antes', 'lo antes posible'])) urgencia = 'alta';
  else if (categoria === 'reclamo' || categoria === 'facturacion' || categoria === 'soporte') urgencia = 'media';

  const primeraFrase = mensaje.trim().split(/[.!?\n]/)[0].trim();
  const resumen = `[${categoria}] ${primeraFrase.slice(0, 120)}`;
  const respuestaSugerida = RESPUESTAS[categoria].replace('{nombre}', nombre);

  return { categoria, urgencia, resumen, respuestaSugerida };
}

// Etapa 3: acá se llama a la API de OpenAI y se devuelve el mismo formato.
async function clasificarConOpenAI() {
  throw new Error('El modo openai todavía no está implementado (etapa 3)');
}

// Devuelve { categoria, urgencia, resumen, respuestaSugerida }
async function clasificar(consulta) {
  if (env.aiMode === 'openai') return clasificarConOpenAI(consulta);
  return clasificarMock(consulta);
}

module.exports = { clasificar };

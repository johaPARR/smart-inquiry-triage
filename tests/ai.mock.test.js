// Clasificador en modo mock (reglas por palabras clave).
process.env.API_KEY = 'clave-de-test';
process.env.MONGO_URI = 'mongodb://localhost:27018/triage-test';
process.env.AI_MODE = 'mock';

const { clasificar } = require('../src/services/ai.service');

test('detecta facturación con urgencia alta', async () => {
  const r = await clasificar({ nombre: 'Ana', canal: 'web', mensaje: 'Me cobraron dos veces y necesito el reembolso hoy.' });
  expect(r.categoria).toBe('facturacion');
  expect(r.urgencia).toBe('alta');
  expect(r.respuestaSugerida).toContain('Ana');
});

test('detecta ventas con urgencia baja', async () => {
  const r = await clasificar({ nombre: 'Leo', canal: 'email', mensaje: 'Hola, quiero saber el precio del plan anual.' });
  expect(r.categoria).toBe('ventas');
  expect(r.urgencia).toBe('baja');
});

test('mensaje sin palabras clave cae en "otro"', async () => {
  const r = await clasificar({ nombre: 'Sol', canal: 'web', mensaje: 'Buenas tardes.' });
  expect(r.categoria).toBe('otro');
});

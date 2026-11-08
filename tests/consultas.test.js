// Tests de la API. El modelo se simula (mock): no hace falta MongoDB para correrlos.
process.env.API_KEY = 'clave-de-test';
process.env.MONGO_URI = 'mongodb://localhost:27018/triage-test';
process.env.AI_MODE = 'mock';

jest.mock('../src/models/Consulta', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));
jest.mock('../src/services/ai.service', () => ({ clasificar: jest.fn() }));

const request = require('supertest');
const app = require('../src/app');
const Consulta = require('../src/models/Consulta');
const { clasificar } = require('../src/services/ai.service');

const KEY = { 'x-api-key': 'clave-de-test' };
const ID_VALIDO = '64b7f0f0f0f0f0f0f0f0f0f0';

const datosValidos = {
  externalId: 'web-0001',
  nombre: 'Ana Pérez',
  email: 'ana@ejemplo.com',
  canal: 'web',
  mensaje: 'Me cobraron dos veces el mes pasado y necesito el reembolso hoy.',
};

const clasificacion = {
  categoria: 'facturacion',
  urgencia: 'alta',
  resumen: 'Cobro duplicado y pide reembolso urgente.',
  respuestaSugerida: 'Hola Ana, ya estamos revisando tu caso.',
};

// Simula un documento de Mongoose: tiene save() y guarda los datos
const crearDocFalso = (datos) => ({ id: ID_VALIDO, estado: 'pendiente', ...datos, save: jest.fn().mockResolvedValue() });

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/consultas', () => {
  test('201: crea y clasifica la consulta', async () => {
    Consulta.findOne.mockResolvedValue(null);
    Consulta.create.mockResolvedValue(crearDocFalso(datosValidos));
    clasificar.mockResolvedValue(clasificacion);

    const res = await request(app).post('/api/consultas').set(KEY).send(datosValidos);

    expect(res.status).toBe(201);
    expect(res.body.estado).toBe('clasificada');
    expect(res.body.clasificacion.categoria).toBe('facturacion');
  });

  test('200: si el externalId ya existe devuelve la existente sin crear otra', async () => {
    Consulta.findOne.mockResolvedValue(crearDocFalso({ ...datosValidos, estado: 'clasificada', clasificacion }));

    const res = await request(app).post('/api/consultas').set(KEY).send(datosValidos);

    expect(res.status).toBe(200);
    expect(res.body.externalId).toBe('web-0001');
    expect(Consulta.create).not.toHaveBeenCalled();
    expect(clasificar).not.toHaveBeenCalled();
  });

  test('400: faltan datos obligatorios', async () => {
    const res = await request(app).post('/api/consultas').set(KEY).send({ externalId: 'x-1' });

    expect(res.status).toBe(400);
    expect(res.body.detalles.length).toBeGreaterThan(0);
  });

  test('400: canal inválido y mensaje demasiado largo', async () => {
    const res = await request(app)
      .post('/api/consultas')
      .set(KEY)
      .send({ ...datosValidos, canal: 'paloma', mensaje: 'a'.repeat(2001) });

    expect(res.status).toBe(400);
    expect(res.body.detalles).toHaveLength(2);
  });

  test('400: JSON mal formado', async () => {
    const res = await request(app)
      .post('/api/consultas')
      .set(KEY)
      .set('Content-Type', 'application/json')
      .send('{ esto no es json');

    expect(res.status).toBe(400);
  });

  test('502: si la IA falla, la consulta queda en estado error', async () => {
    const doc = crearDocFalso(datosValidos);
    Consulta.findOne.mockResolvedValue(null);
    Consulta.create.mockResolvedValue(doc);
    clasificar.mockRejectedValue(new Error('IA caída'));

    const res = await request(app).post('/api/consultas').set(KEY).send(datosValidos);

    expect(res.status).toBe(502);
    expect(doc.estado).toBe('error');
    expect(doc.errorDetalle).toBe('IA caída');
    expect(doc.save).toHaveBeenCalled();
  });
});

describe('API key', () => {
  test('401: sin x-api-key', async () => {
    const res = await request(app).get('/api/consultas');
    expect(res.status).toBe(401);
  });

  test('401: x-api-key incorrecta', async () => {
    const res = await request(app).get('/api/consultas').set('x-api-key', 'otra-clave');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/consultas', () => {
  test('200: lista consultas aplicando filtros', async () => {
    const limit = jest.fn().mockResolvedValue([crearDocFalso(datosValidos)]);
    const sort = jest.fn().mockReturnValue({ limit });
    Consulta.find.mockReturnValue({ sort });

    const res = await request(app).get('/api/consultas?urgencia=alta').set(KEY);

    expect(res.status).toBe(200);
    expect(res.body.cantidad).toBe(1);
    expect(Consulta.find).toHaveBeenCalledWith({ 'clasificacion.urgencia': 'alta' });
  });

  test('400: filtro con valor inválido', async () => {
    const res = await request(app).get('/api/consultas?urgencia=gigante').set(KEY);
    expect(res.status).toBe(400);
  });
});

describe('GET /api/consultas/:id', () => {
  test('200: devuelve la consulta', async () => {
    Consulta.findById.mockResolvedValue(crearDocFalso(datosValidos));
    const res = await request(app).get(`/api/consultas/${ID_VALIDO}`).set(KEY);
    expect(res.status).toBe(200);
  });

  test('404: la consulta no existe', async () => {
    Consulta.findById.mockResolvedValue(null);
    const res = await request(app).get(`/api/consultas/${ID_VALIDO}`).set(KEY);
    expect(res.status).toBe(404);
  });

  test('400: el id no es válido', async () => {
    const res = await request(app).get('/api/consultas/123').set(KEY);
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/consultas/:id', () => {
  test('200: actualiza el estado', async () => {
    Consulta.findByIdAndUpdate.mockResolvedValue(crearDocFalso({ ...datosValidos, estado: 'notificada' }));

    const res = await request(app).patch(`/api/consultas/${ID_VALIDO}`).set(KEY).send({ estado: 'notificada' });

    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('notificada');
  });

  test('400: estado inválido', async () => {
    const res = await request(app).patch(`/api/consultas/${ID_VALIDO}`).set(KEY).send({ estado: 'volando' });
    expect(res.status).toBe(400);
  });

  test('404: la consulta no existe', async () => {
    Consulta.findByIdAndUpdate.mockResolvedValue(null);
    const res = await request(app).patch(`/api/consultas/${ID_VALIDO}`).set(KEY).send({ estado: 'notificada' });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/health', () => {
  test('no pide API key y avisa que Mongo no está conectado (en tests no se conecta)', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(503);
    expect(res.body.api).toBe('ok');
    expect(res.body.mongo).toBe('desconectado');
  });
});

test('404: ruta inexistente', async () => {
  const res = await request(app).get('/api/nada');
  expect(res.status).toBe(404);
});

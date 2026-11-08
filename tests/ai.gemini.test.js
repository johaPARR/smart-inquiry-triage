// Clasificador con Gemini. fetch se simula: no se llama a Google ni se gasta cuota.
process.env.API_KEY = 'clave-de-test';
process.env.MONGO_URI = 'mongodb://localhost:27018/triage-test';
process.env.AI_MODE = 'gemini';
process.env.GEMINI_API_KEY = 'gemini-key-de-test';
process.env.GEMINI_MODEL = 'modelo-de-test';
process.env.GEMINI_RETRY_MS = '0'; // sin pausas entre reintentos en los tests

const { clasificar } = require('../src/services/ai.service');

const consulta = { nombre: 'Ana', canal: 'web', mensaje: 'Me debitaron otra vez la tarjeta y quiero mi plata hoy.' };

// Arma una respuesta como la de Gemini con el texto que le pasemos
const respuestaGemini = (texto) => ({
  ok: true,
  status: 200,
  json: async () => ({ candidates: [{ content: { parts: [{ text: texto }] } }] }),
});

const resultadoValido = {
  categoria: 'facturacion',
  urgencia: 'alta',
  resumen: 'Cobro duplicado con la tarjeta; pide devolución hoy.',
  respuestaSugerida: 'Hola Ana, ya estamos revisando el débito y te confirmamos la devolución.',
};

beforeEach(() => {
  global.fetch = jest.fn();
});

test('devuelve la clasificación del modelo', async () => {
  global.fetch.mockResolvedValue(respuestaGemini(JSON.stringify(resultadoValido)));

  const r = await clasificar(consulta);

  expect(r).toEqual(resultadoValido);
});

test('manda la API key por header y el modelo en la URL (no la key)', async () => {
  global.fetch.mockResolvedValue(respuestaGemini(JSON.stringify(resultadoValido)));

  await clasificar(consulta);

  const [url, opciones] = global.fetch.mock.calls[0];
  expect(url).toContain('modelo-de-test:generateContent');
  expect(url).not.toContain('gemini-key-de-test');
  expect(opciones.headers['x-goog-api-key']).toBe('gemini-key-de-test');
});

test('falla si Gemini responde con error HTTP (ej. límite de cuota)', async () => {
  global.fetch.mockResolvedValue({ ok: false, status: 429, text: async () => 'cuota excedida' });

  await expect(clasificar(consulta)).rejects.toThrow('429');
});

test('falla si la respuesta no es JSON', async () => {
  global.fetch.mockResolvedValue(respuestaGemini('esto no es json'));

  await expect(clasificar(consulta)).rejects.toThrow('JSON válido');
});

test('falla si la categoría no es una de las permitidas', async () => {
  global.fetch.mockResolvedValue(respuestaGemini(JSON.stringify({ ...resultadoValido, categoria: 'inventada' })));

  await expect(clasificar(consulta)).rejects.toThrow('inválida');
});

test('falla si Gemini no devuelve texto', async () => {
  global.fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ candidates: [] }) });

  await expect(clasificar(consulta)).rejects.toThrow('no devolvió texto');
});

test('falla si hay un error de red', async () => {
  global.fetch.mockRejectedValue(new Error('sin internet'));

  await expect(clasificar(consulta)).rejects.toThrow('sin internet');
});

describe('reintentos', () => {
  const error503 = { ok: false, status: 503, text: async () => 'alta demanda' };

  test('reintenta si Gemini está saturado (503) y termina bien', async () => {
    global.fetch
      .mockResolvedValueOnce(error503)
      .mockResolvedValueOnce(error503)
      .mockResolvedValueOnce(respuestaGemini(JSON.stringify(resultadoValido)));

    const r = await clasificar(consulta);

    expect(r).toEqual(resultadoValido);
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  test('reintenta si hay timeout', async () => {
    const timeout = Object.assign(new Error('aborted'), { name: 'TimeoutError' });
    global.fetch
      .mockRejectedValueOnce(timeout)
      .mockResolvedValueOnce(respuestaGemini(JSON.stringify(resultadoValido)));

    const r = await clasificar(consulta);

    expect(r).toEqual(resultadoValido);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  test('se rinde después de 3 intentos y avisa cuántos hizo', async () => {
    global.fetch.mockResolvedValue(error503);

    await expect(clasificar(consulta)).rejects.toThrow('intentos: 3');
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  test('timeout persistente da un mensaje claro', async () => {
    global.fetch.mockRejectedValue(Object.assign(new Error('aborted'), { name: 'TimeoutError' }));

    await expect(clasificar(consulta)).rejects.toThrow('no respondió a tiempo');
  });

  test('NO reintenta errores de configuración (ej. 404 modelo inexistente)', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 404, text: async () => 'modelo no encontrado' });

    await expect(clasificar(consulta)).rejects.toThrow('404');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});

# Smart Inquiry Triage API: Etapa 1 (Diseño)

Backend que recibe consultas, las clasifica con IA y automatiza qué pasa después.

## Flujo

1. Webhook (n8n): llega una consulta (nombre, mensaje, canal).
2. n8n llama al backend: `POST /api/consultas`. Node.js valida y guarda la consulta como `pendiente`.
3. El backend llama a la API de OpenAI y recibe un JSON con `categoria`, `urgencia`, `resumen` y `respuestaSugerida`.
4. El backend guarda el resultado en MongoDB y responde a n8n.
5. n8n decide: urgencia alta, aviso por Telegram. Si no, cola o email.
6. n8n llama a `PATCH /api/consultas/:id` para marcar el estado como `notificada`.
7. Si algo falla, un flujo de error en n8n lo registra y avisa.

## Modelo de datos (colección `consultas`)

```json
{
  "_id": "ObjectId",
  "externalId": "string (único, para idempotencia)",
  "nombre": "string",
  "email": "string (opcional)",
  "canal": "web | whatsapp | email | formulario",
  "mensaje": "string (máx. 2000 caracteres)",
  "estado": "pendiente | clasificada | notificada | error",
  "clasificacion": {
    "categoria": "ventas | soporte | facturacion | reclamo | otro",
    "urgencia": "baja | media | alta",
    "resumen": "string",
    "respuestaSugerida": "string"
  },
  "errorDetalle": "string (solo si estado = error)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

## Endpoints

Todos, menos `/api/health`, requieren el header `x-api-key`.

| Método | Ruta | Qué hace |
|---|---|---|
| GET | /api/health | Verifica que la API y Mongo funcionan |
| POST | /api/consultas | Recibe, valida, guarda, clasifica con IA y devuelve la consulta |
| GET | /api/consultas | Lista consultas (filtros: estado, urgencia, categoria) |
| GET | /api/consultas/:id | Detalle de una consulta |
| PATCH | /api/consultas/:id | Actualiza el estado (ej.: notificada) |

## Códigos de respuesta

- 201: consulta creada y clasificada
- 200: consulta repetida (mismo externalId), devuelve la existente
- 400: datos inválidos
- 401: falta o es incorrecta la API key
- 404: consulta no encontrada
- 502: falló la IA (la consulta queda en estado `error`, no se pierde)

## Ejemplo

```json
// POST /api/consultas
{
  "externalId": "web-0001",
  "nombre": "Ana Pérez",
  "email": "ana@ejemplo.com",
  "canal": "web",
  "mensaje": "Me cobraron dos veces el mes pasado y necesito el reembolso hoy."
}
```

```json
// Respuesta 201
{
  "id": "…",
  "estado": "clasificada",
  "clasificacion": {
    "categoria": "facturacion",
    "urgencia": "alta",
    "resumen": "Cliente reporta un cobro duplicado y pide reembolso urgente.",
    "respuestaSugerida": "Hola Ana, lamentamos el inconveniente. Ya estamos revisando el cobro duplicado y te confirmamos el reembolso a la brevedad."
  }
}
```

## Estructura de carpetas

```
smart-inquiry-triage/
├── src/
│   ├── config/
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── middlewares/
│   ├── app.js
│   └── server.js
├── tests/
├── n8n/
├── docs/
├── .env.example
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## Variables de entorno

```
PORT=3000
MONGO_URI=mongodb://localhost:27017/triage
API_KEY=cambiar-esto
OPENAI_API_KEY=
OPENAI_MODEL=
AI_MODE=mock
```

## Stack

Node.js + Express, MongoDB, n8n (self-hosted en Docker), OpenAI API, Telegram Bot API, Docker Compose, GitHub Actions. Sin front-end y sin Python en la v1.

## Etapas

1. Diseño (este documento)
2. Backend base + MongoDB + validación
3. Integración con OpenAI
4. Webhook + workflow en n8n
5. Telegram, errores y seguridad
6. Docker Compose + tests + CI
7. README, capturas y textos de catálogo
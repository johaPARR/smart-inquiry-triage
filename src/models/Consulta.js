// Modelo de la colección "consultas" (ver docs/etapa-1-diseno.md).
const mongoose = require('mongoose');
const {
  CANALES, ESTADOS, CATEGORIAS, URGENCIAS, MAX_MENSAJE, MAX_NOMBRE,
} = require('../config/constantes');

const consultaSchema = new mongoose.Schema(
  {
    // externalId único: permite que n8n reenvíe la misma consulta sin duplicarla
    externalId: { type: String, required: true, unique: true, trim: true },
    nombre: { type: String, required: true, trim: true, maxlength: MAX_NOMBRE },
    email: { type: String, trim: true, lowercase: true },
    canal: { type: String, required: true, enum: CANALES },
    mensaje: { type: String, required: true, trim: true, maxlength: MAX_MENSAJE },
    estado: { type: String, enum: ESTADOS, default: 'pendiente' },
    clasificacion: {
      categoria: { type: String, enum: CATEGORIAS },
      urgencia: { type: String, enum: URGENCIAS },
      resumen: String,
      respuestaSugerida: String,
    },
    errorDetalle: String, // solo si estado = error
  },
  { timestamps: true } // createdAt y updatedAt automáticos
);

// En las respuestas: "id" en lugar de "_id" y sin "__v"
consultaSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Consulta', consultaSchema);

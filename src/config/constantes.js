// Valores permitidos, compartidos por el modelo, las validaciones y la IA.
module.exports = {
  CANALES: ['web', 'whatsapp', 'email', 'formulario'],
  ESTADOS: ['pendiente', 'clasificada', 'notificada', 'error'],
  CATEGORIAS: ['ventas', 'soporte', 'facturacion', 'reclamo', 'otro'],
  URGENCIAS: ['baja', 'media', 'alta'],
  MAX_MENSAJE: 2000,
  MAX_NOMBRE: 100,
};

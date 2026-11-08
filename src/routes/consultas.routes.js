const { Router } = require('express');
const apiKey = require('../middlewares/apiKey');
const { validarCrear, validarId, validarEstado, validarFiltros } = require('../middlewares/validate');
const controller = require('../controllers/consultas.controller');

const router = Router();

router.use(apiKey); // todas las rutas de consultas requieren x-api-key

router.post('/', validarCrear, controller.crear);
router.get('/', validarFiltros, controller.listar);
router.get('/:id', validarId, controller.obtener);
router.patch('/:id', validarId, validarEstado, controller.actualizarEstado);

module.exports = router;

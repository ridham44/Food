const router = require('express').Router();
const auth = require('../../middlewares/middleware');
const controller = require('./lib/controller');

router.post('/table', auth, controller.create);
router.put('/table/:id', auth, controller.update);
router.delete('/table/:id', auth, controller.delete);
router.get('/table', auth, controller.findAll);
router.put('/table/status/:id', auth, controller.updateStatus);

module.exports = router;

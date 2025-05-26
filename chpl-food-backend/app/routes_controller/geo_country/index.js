const router = require('express').Router();
const controller = require('./lib/controller');
const auth = require('../../middlewares/middleware');
const { expressValidate } = require('../../../utils/lib/common-function');
const { validationRules,updateValidations } = require('./lib/validation');

router.post('/city', auth, validationRules(), expressValidate, controller.create);

router.put('/city/:id', auth, updateValidations(), expressValidate, controller.update);

router.delete('/city/:id', auth, controller.delete);

router.post('/city-filter', auth, controller.cityFiltration);

router.get('/city-filter/options', auth, controller.cityForFilter);

router.get('/city/options', auth, controller.findAll);

router.get('/city', auth, controller.findAll);

router.get('/city/cascade/:id', auth, controller.findAll);

router.get('/city/:id', auth, controller.findById);

router.put('/city/status/:id', auth, controller.updateStatus);

module.exports = router;

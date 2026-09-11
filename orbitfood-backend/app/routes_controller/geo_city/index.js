const router = require('express').Router();
const controller = require('./lib/controller');
const auth = require('../../middlewares/middleware');
const adminOnly = require('../../middlewares/adminMiddleware');
const { expressValidate } = require('../../../utils/lib/common-function');
const { validationRules, updateValidations } = require('./lib/validation');

// Shared platform reference data (no tenantId column) — admin-only writes
router.post('/city', auth, adminOnly, validationRules(), expressValidate, controller.create);

router.put('/city/:id', auth, adminOnly, updateValidations(), expressValidate, controller.update);

router.delete('/city/:id', auth, adminOnly, controller.delete);

router.post('/city-filter', auth, controller.cityFiltration);

router.get('/city-filter/options', auth, controller.cityForFilter);

router.get('/city/options', auth, controller.findAll);

router.get('/city', auth, controller.findAll);

// Public, unauthenticated lookup for the customer signup/address form
router.get('/public/city/cascade/:id/options', controller.findAll);

router.get('/city/cascade/:id', auth, controller.findAll);

router.get('/city/:id', auth, controller.findById);

router.put('/city/status/:id', auth, adminOnly, controller.updateStatus);

router.post('/city/filter', auth, controller.filtration);

module.exports = router;

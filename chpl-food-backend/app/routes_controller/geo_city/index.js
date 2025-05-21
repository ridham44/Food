const router = require('express').Router();
const controller = require('./lib/controller');
const auth = require('../../middlewares/middleware');
const { expressValidate } = require('../../../utils/lib/common-function');
const { validationRules, updateValidations } = require('./lib/validation');

// Create city
router.post('/', auth, validationRules(), expressValidate, controller.create);

// Update city
router.put('/:id', auth, updateValidations(), expressValidate, controller.update);

// Delete city
router.delete('/:id', auth, controller.delete);

// Get all cities
router.get('/', auth, controller.findAll);

// Get city by ID
router.get('/:id', auth, controller.findById);

// Filter cities (pagination, search, etc.)
router.post('/city-filter', auth, controller.cityFiltration);

// Get filter dropdown options
router.get('/city-filter/options', auth, controller.cityForFilter);

// Get all city options (e.g., for dropdowns)
router.get('/options', auth, controller.findAll);

// Cascade fetch: get all cities for a state ID
router.get('/cascade/:id', auth, controller.findAll);

// Update city status
router.put('/status/:id', auth, controller.updateStatus);

module.exports = router;

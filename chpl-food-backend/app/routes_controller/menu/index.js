const router = require('express').Router();
const auth = require('../../middlewares/middleware');
const { expressValidate } = require('../../../utils/lib/common-function');
const { validationRules, updateValidations } = require('./lib/validation');
const controller = require('./lib/controller');

// Create menu
router.post('/menu', auth, validationRules(), expressValidate, controller.create);

// Update menu
router.put('/menu/:id', auth, updateValidations(), expressValidate, controller.update);

// Delete menu
router.delete('/menu/:id', auth, controller.delete);

// Get all menus
router.get('/menu', auth, controller.findAll);

// Get menu by ID
router.get('/menu/:id', auth, controller.findById);

// Menu filtration
router.post('/menu-filter', auth, controller.menuFiltration);

// Menu filter options
router.get('/menu-filter/options', auth, controller.menuForFilter);

module.exports = router;

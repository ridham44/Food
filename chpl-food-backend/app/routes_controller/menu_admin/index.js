const router = require('express').Router();
const auth = require('../../middlewares/middleware');
const { expressValidate } = require('../../../utils/lib/common-function');
const { validationRules, updateValidations } = require('./lib/validation');
const controller = require('./lib/controller');

// Create menu
router.post('/menu-admin', auth, validationRules(), expressValidate, controller.create);

// Update menu
router.put('/menu-admin/:id', auth, updateValidations(), expressValidate, controller.update);

// Delete menu
router.delete('/menu-admin/:id', auth, controller.delete);

// Get all menus
router.get('/menu-admin', auth, controller.findAll);

// Menu filter options
router.get('/menu-admin-filter/options', auth, controller.menuAdminForFilter);

// Menu filtration
router.post('/menu-admin-filter', auth, controller.filtration);

// Update menu status
router.put('/menu-admin/status/:id', auth, controller.updateStatus);

// Get menu by ID
router.get('/menu-admin/:id', auth, controller.findById);

module.exports = router;

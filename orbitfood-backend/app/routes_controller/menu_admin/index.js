const router = require('express').Router();
const auth = require('../../middlewares/middleware');
const adminOnly = require('../../middlewares/adminMiddleware');
const { expressValidate } = require('../../../utils/lib/common-function');
const { validationRules, updateValidations } = require('./lib/validation');
const controller = require('./lib/controller');

// MenuAdmin is a global, platform-wide nav/permission-menu table (no
// tenantId column) — every tenant's role-permission gating depends on it, so
// only a platform admin may create/modify/delete entries.

// Create menu
router.post('/menu-admin', auth, adminOnly, validationRules(), expressValidate, controller.create);

// Update menu
router.put('/menu-admin/:id', auth, adminOnly, updateValidations(), expressValidate, controller.update);

// Delete menu
router.delete('/menu-admin/:id', auth, adminOnly, controller.delete);

// Get all menus
router.get('/menu-admin', auth, controller.findAll);

// Menu filter options
router.get('/menu-admin-filter/options', auth, controller.menuAdminForFilter);

// Menu filtration
router.post('/menu-admin-filter', auth, controller.filtration);

// Update menu status
router.put('/menu-admin/status/:id', auth, adminOnly, controller.updateStatus);

// Get menu by ID
router.get('/menu-admin/:id', auth, controller.findById);

module.exports = router;

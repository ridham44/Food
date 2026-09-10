const router = require('express').Router();
const auth = require('../../middlewares/middleware');
const adminOnly = require('../../middlewares/adminMiddleware');
const { expressValidate } = require('../../../utils/lib/common-function');
const { validationRules, updateValidations } = require('./lib/validation');
const controller = require('./lib/controller');

// Setting is a global platform-wide key/value config table (not
// tenant-specific) — every route here is admin-only.

// Create setting
router.post('/setting', auth, adminOnly, validationRules(), expressValidate, controller.create);

// Update setting
router.put('/setting/:id', auth, adminOnly, updateValidations(), expressValidate, controller.update);

// Delete setting
router.delete('/setting/:id', auth, adminOnly, controller.delete);

// Get all settings
router.get('/setting', auth, adminOnly, controller.findAll);

// Setting filter options
router.get('/setting-filter/options', auth, adminOnly, controller.settingForFilter);

// Setting filtration
router.post('/setting-filter', auth, adminOnly, controller.settingFiltration);

// Update setting status
router.put('/setting/status/:id', auth, adminOnly, controller.updateStatus);

// Get setting by ID
router.get('/setting/:id', auth, adminOnly, controller.findById);

// Finding settings by created user ID
router.get('/setting/by-user/:userId', auth, adminOnly, controller.findByCreatedUserId);

// Finding with date
router.post('/setting/filter', auth, adminOnly, controller.filtration);

module.exports = router;

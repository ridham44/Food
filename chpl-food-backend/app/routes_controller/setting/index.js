const router = require('express').Router();
const auth = require('../../middlewares/middleware');
const { expressValidate } = require('../../../utils/lib/common-function');
const { validationRules, updateValidations } = require('./lib/validation');
const controller = require('./lib/controller');

// Create setting
router.post('/setting', auth, validationRules(), expressValidate, controller.create);

// Update setting
router.put('/setting/:id', auth, updateValidations(), expressValidate, controller.update);

// Delete setting
router.delete('/setting/:id', auth, controller.delete);

// Get all settings
router.get('/setting', auth, controller.findAll);

// Setting filter options
router.get('/setting-filter/options', auth, controller.settingForFilter);

// Setting filtration
router.post('/setting-filter', auth, controller.settingFiltration);

// Update setting status
router.put('/setting/status/:id', auth, controller.updateStatus);

// Get setting by ID
router.get('/setting/:id', auth, controller.findById);

// Finding settings by created user ID
router.get('/setting/by-user/:userId', auth, controller.findByCreatedUserId);

// Finding with date
router.post('/setting/date-filter', auth, controller.dateFiltration);

module.exports = router;

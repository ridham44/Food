const router = require('express').Router();
const auth = require('../../middlewares/middleware');
const { expressValidate } = require('../../../utils/lib/common-function');
const { validationRules, updateValidations } = require('./lib/validation');
const controller = require('./lib/controller');

// Create
router.post('/permission', auth, validationRules(), expressValidate, controller.create);

// Update
router.put('/permission/:id', auth, updateValidations(), expressValidate, controller.update);

// Delete
router.delete('/permission/:id', auth, controller.delete);

// Get all
router.get('/permission', auth, controller.findAll);

// Get one
router.get('/permission/:id', auth, controller.findById);

// Filter
router.post('/permission-filter', auth, controller.filtration);

// Filter options
router.get('/permission-filter/options', auth, controller.permissionFilterOptions);

module.exports = router;

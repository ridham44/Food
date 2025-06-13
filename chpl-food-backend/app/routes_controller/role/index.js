const router = require('express').Router();
const auth = require('../../middlewares/middleware');
const { expressValidate } = require('../../../utils/lib/common-function');
const { validationRules, updateValidations } = require('./lib/validation');
const controller = require('./lib/controller');

// Create role
router.post('/role', auth, validationRules(), expressValidate, controller.create);

// Update role
router.put('/role/:id', auth, updateValidations(), expressValidate, controller.update);

// Delete role
router.delete('/role/:id', auth, controller.delete);

// Get all roles
router.get('/role', auth, controller.findAll);

// Role filter options
router.get('/role-filter/options', auth, controller.roleForFilter);

// Role filtration
router.post('/role-filter', auth, controller.roleFiltration);

// Update role status
router.put('/role/status/:id', auth, controller.updateStatus);

// Get role by ID
router.get('/role/:id', auth, controller.findById);

// Finding with date
router.post('/role/date-filter', auth, controller.dateFiltration);

module.exports = router;

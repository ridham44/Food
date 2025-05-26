const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/middleware');
const { expressValidate } = require('../../../utils/lib/common-function');
const { validationRules, updateValidations } = require('./lib/validation');
const controller = require('./lib/controller');

// Create tenant
router.post('/tenant', auth, validationRules(), expressValidate, controller.create);

// Update tenant
router.put('/tenant/:id', auth, updateValidations(), expressValidate, controller.update);

// Delete tenant
router.delete('/tenant/:id', auth, controller.delete);

// Get all tenants
router.get('/tenant', auth, controller.findAll);

// Tenant filter options
router.get('/tenant-filter/options', auth, controller.tenantForFilter);

// Tenant filtration
router.post('/tenant-filter', auth, controller.tenantFiltration);

// Update tenant status
router.put('/tenant/status/:id', auth, controller.updateStatus);

// Get tenant by ID
router.get('/tenant/:id', auth, controller.findById);

module.exports = router;

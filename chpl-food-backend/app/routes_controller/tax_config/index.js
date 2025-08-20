const router = require('express').Router();
const auth = require('../../middlewares/middleware');
const { expressValidate } = require('../../../utils/lib/common-function');
const { createValidation, updateValidation } = require('./lib/validation');
const controller = require('./lib/controller');

// Create tax config
router.post('/tax-config', auth, createValidation(), expressValidate, controller.create);

// Update tax config
router.put('/tax-config/:id', auth, updateValidation(), expressValidate, controller.update);

// Delete tax config
router.delete('/tax-config/:id', auth, controller.delete);

// Get all tax configs
router.get('/tax-config', auth, controller.findAll);

// Get tax config by ID
router.get('/tax-config/:id', auth, controller.findById);

// Update tax config status
router.put('/tax-config/status/:id', auth, controller.updateStatus);

// Get tax policy report of all tenants (Admin/Superadmin only)
router.get('/tax-config/report-all', auth, controller.getAllTenantTaxReport);

// Get tax summary for a specific tenant
router.post('/tax-config/report-summary', auth, controller.getTenantTaxSummary);

//Get Packing fees
router.post('/tax-config/packing-fees', auth, controller.getPackingFeeSummary);

module.exports = router;

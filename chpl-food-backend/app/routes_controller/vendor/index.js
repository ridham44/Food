const router = require('express').Router();
const controller = require('./lib/controller');
const auth = require('../../middlewares/middleware');
const { expressValidate } = require('../../../utils/lib/common-function');

const {
    createVendorValidation,
    updateVendorValidation,
    statusUpdateVendorValidation,
    createVendorItemValidation,
    updateVendorItemValidation,
} = require('./lib/validation');

// ---------------- Vendor Routes ----------------

// Create Vendor
router.post('/vendor', auth, createVendorValidation(), expressValidate, controller.createVendor);

// Get All Vendors
router.get('/vendor', auth, controller.getAllVendors);

// Update Vendor
router.put('/vendor/:id', auth, updateVendorValidation(), expressValidate, controller.updateVendor);

// Delete Vendor
router.delete('/vendor/:id', auth, controller.deleteVendor);

// Get Vendor by ID
router.get('/vendor/:id', auth, controller.getVendorById);

// Update Vendor Status
router.patch('/vendor/status/:id', auth, statusUpdateVendorValidation(), expressValidate, controller.updateVendorStatus);

//Get Vendor Summary Report
router.post('/vendor/summary-report', auth, controller.vendorSummaryReport);

// ---------------- Vendor Item Routes ----------------

// Create Vendor Item
router.post('/vendor-item', auth, createVendorItemValidation(), expressValidate, controller.createVendorItem);

// Get All Vendor Items by id
router.get('/vendor-item/:id', auth, controller.getVendorItemById);

// Update Vendor Item
router.put('/vendor-item/:id', auth, updateVendorItemValidation(), expressValidate, controller.updateVendorItem);

// Delete Vendor Item
router.delete('/vendor-item/:id', auth, controller.deleteVendorItem);

// Update Vendor Item Status
router.get('/vendor-item/get-all/:id', auth, expressValidate, controller.getAllVendorItemsForVendor);

module.exports = router;

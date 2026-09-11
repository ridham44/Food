const express = require('express');
const router = express.Router();
const controller = require('./lib/generator');
const auth = require('../../middlewares/middleware');
const dualAuth = require('../../middlewares/CustomerMiddlewear');

router.post('/bill-pdf', auth, controller.generateInvoicePDF);

// Authenticated download — see storage/ownership comments in the controller.
router.get('/bill-pdf/:orderId/download', dualAuth, controller.downloadInvoicePDF);

module.exports = router;

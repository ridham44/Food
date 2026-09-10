const express = require('express');
const router = express.Router();
const controller = require('./lib/generator');
const auth = require('../../middlewares/middleware');

router.post('/bill-pdf', auth, controller.generateInvoicePDF); 
module.exports = router;

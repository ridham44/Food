const express = require('express');
const router = express.Router();
const controller = require('./lib/controller');
const { expressValidate } = require('../../../utils/lib/common-function');
const { createRazorpayOrderValidation, verifyPaymentValidation } = require('./lib/validation');
const auth = require('../../middlewares/CustomerMiddlewear');

// Public — only ever hands out the safe-to-expose Razorpay key id.
router.get('/payment/config', controller.getPaymentConfig);

router.post('/order/checkout/create-razorpay-order', auth, createRazorpayOrderValidation(), expressValidate, controller.createRazorpayOrder);

router.post('/order/checkout/verify-payment', auth, verifyPaymentValidation(), expressValidate, controller.verifyAndCompleteOrder);

// No auth — Razorpay's server can't present a customer JWT. Trust boundary
// is the HMAC signature over the raw body instead (see server.js's
// bodyParser `verify` callback for req.rawBody).
router.post('/order/checkout/webhook', controller.handleWebhook);

module.exports = router;

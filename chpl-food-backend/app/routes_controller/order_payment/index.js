const router = require('express').Router();
const auth = require('../../middlewares/CustomerMiddlewear');
const controller = require('./lib/controller');
const { paymentValidation, unpaidbillsvalidation } = require('./lib/validation');

// get bill
router.post('/bill', auth, unpaidbillsvalidation(), controller.getUnpaidBillsByCustomer);

// pay bill
router.post('/pay', auth, paymentValidation(), controller.makePaymentByBillId);

// get payment mode report
router.post('/payment-type-report', auth, controller.getPaymentModeReport);

// get payment mode totals
router.post('/payment-overview', auth, controller.getPaymentTotals);

module.exports = router;

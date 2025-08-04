const router = require('express').Router();
const auth = require('../../middlewares/CustomerMiddlewear');
const controller = require('./lib/controller');
const { expressValidate } = require('../../../utils/lib/common-function');
const { paymentValidation, unpaidbillsvalidation } = require('./lib/validation');

// get bill
router.post('/payment/bill', auth, unpaidbillsvalidation(), expressValidate, controller.getUnpaidBillsByCustomer);

// pay bill
router.post('/payment/pay', auth, paymentValidation(), expressValidate, controller.makePaymentByBillId);

// get payment mode report
router.post('/payment/type-report', auth, controller.getPaymentModeReport);

// get payment mode totals
router.post('/payment/overview', auth, controller.getPaymentTotals);

//Bill slip
router.post('/payment/slip', auth, controller.generatePreview);


module.exports = router;

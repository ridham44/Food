const router = require('express').Router();
const auth = require('../../middlewares/CustomerMiddlewear');
const staffAuth = require('../../middlewares/middleware');
const controller = require('./lib/controller');
const { expressValidate } = require('../../../utils/lib/common-function');
const { paymentValidation, unpaidbillsvalidation } = require('./lib/validation');

// Front-desk lookup by phone number and tenant-wide reports — these only
// ever make sense for tenant staff (they all key off req.user.tenantId), so
// they're staff-only rather than the dual customer-or-tenant middleware:
// a customer token has no tenantId, and letting a customer reach these was
// previously only accidentally blocked by Sequelize rejecting the resulting
// `tenantId: undefined` where-clause rather than by an actual authz check.

// get bill
router.post('/payment/bill', staffAuth, unpaidbillsvalidation(), expressValidate, controller.getUnpaidBillsByCustomer);

// pay bill — genuinely dual-use (customer self-checkout or staff at-counter),
// and the controller already verifies ownership for both cases.
router.post('/payment/pay', auth, paymentValidation(), expressValidate, controller.makePaymentByBillId);

// get payment mode report
router.post('/payment/type-report', staffAuth, controller.getPaymentModeReport);

// get payment mode totals
router.post('/payment/overview', staffAuth, controller.getPaymentTotals);

// paginated transaction list for the Payments dashboard page
router.get('/payment/list', staffAuth, controller.listPayments);

module.exports = router;

const router = require('express').Router();
const auth = require('../../middlewares/CustomerMiddlewear');
const controller = require('./lib/controller');
const { expressValidate } = require('../../../utils/lib/common-function');
const { dateValidation, validategetOrder } = require('./lib/validation');

// Daily/weekly/monthly order summary report
router.post('/report/summary-date', auth, controller.orderSummary);
// Most sold items report
router.post('/report/most-sold', auth, dateValidation(), expressValidate, controller.mostSoldItems);
// Most ordered combos report
router.get('/report/combo-orders', auth, controller.comboOrdersReport);
//By category
router.get('/report/category', auth, controller.bookingCategoryReport);
//Get all unpaid orders
router.get('/report/unpaid-orders', auth, controller.getUnpaidOrders);
//Get all  orders
router.post('/report/orders', auth, validategetOrder(), expressValidate, controller.getFullOrderDetails);
//Get all cancel orders
router.get('/report/cancel-order', auth, controller.getCancelledOrders);
// routes/reorder/index.js
router.get('/report/orders/:tenantId', auth, controller.getCustomerPreviousOrders);
// Get total revenue and expense
router.post('/report/revenue-vs-expense', auth, controller.getBreakdown);


module.exports = router;

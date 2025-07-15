const router = require('express').Router();
const auth = require('../../middlewares/CustomerMiddlewear');
const controller = require('./lib/controller');
const { dateValidation, validategetOrder } = require('./lib/validation');

// Daily/weekly/monthly order summary report
router.post('/report-summary/date', auth, controller.orderSummary);
// Most sold items report
router.post('/most-sold', auth, dateValidation(), controller.mostSoldItems);
// Most ordered combos report
router.get('/combo-orders', auth, controller.comboOrdersReport);
//By category
router.get('/report-category', auth, controller.bookingCategoryReport);
//Get all unpaid orders
router.get('/unpaid-orders', auth, controller.getUnpaidOrders);
//Get all  orders 
router.post('/orders', auth, validategetOrder(), controller.getFullOrderDetails);

module.exports = router;

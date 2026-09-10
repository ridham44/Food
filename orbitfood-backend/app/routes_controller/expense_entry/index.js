const router = require('express').Router();
const controller = require('./lib/controller');
const auth = require('../../middlewares/middleware');
const { expressValidate } = require('../../../utils/lib/common-function');
const { createExpenseValidation, updateExpenseValidation } = require('./lib/validation');

//Create
router.post('/expense-entry', auth, createExpenseValidation(), expressValidate, controller.create);

//Get All
router.get('/expense-entry', auth, controller.getAll);

//update
router.put('/expense-entry/:id', auth, updateExpenseValidation(), expressValidate, controller.update);

//delete
router.delete('/expense-entry/:id', auth, controller.remove);

//total expense
router.post('/expense-entry/category', auth, controller.expenseCategoryReport);

//Detail report
router.post('/expense-entry/detail', auth, controller.expenseGroupedReport);

//Date wise
router.post('/expense-entry/date', auth, controller.getExpenseReportCombo);

//Payment mode wise
router.post('/expense-entry/payment', auth, controller.expenseByPaymentMode);

module.exports = router;

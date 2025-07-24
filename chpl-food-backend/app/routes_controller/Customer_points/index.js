const router = require('express').Router();
const controller = require('./lib/controller');
const auth = require('../../middlewares/CustomerMiddlewear');
const adminauth = require('../../middlewares/middleware');
const { expressValidate } = require('../../../utils/lib/common-function');
const { redeemPointsValidation } = require('./lib/validation');

router.get('/test', controller.testAssignPoints);

router.post('/redeem-points', auth, redeemPointsValidation(),expressValidate,controller.redeemPointsOnly);

router.post('/points/balance', auth, controller.getPointsBalance);

router.get('/points/history/:customerId', auth, controller.getPointsHistory);

router.get('/points/top-customers', adminauth, controller.topPointHolders);


module.exports = router;

const router = require('express').Router();
const auth = require('../../middlewares/CustomerMiddlewear');
const controller = require('./lib/controller');
const { expressValidate } = require('../../../utils/lib/common-function');
const { redeemCouponValidation, createCouponValidation } = require('./lib/validation');

// Create a new discount coupon
router.post('/coupon', auth, createCouponValidation(), expressValidate, controller.create);

// Redeem a discount coupon
router.post('/redeem-coupon', auth, redeemCouponValidation(), expressValidate, controller.redeemCoupon);

//Update coupon
router.put('/coupon/:id', auth, controller.updateCoupon);

// status update
router.put('/coupon/status/:id', auth, controller.updateCouponStatus);

//Report of all coupon made
router.get('/coupon/report', auth, controller.couponReport);

//Report by id
router.get('/coupon/report/:id', auth, controller.getCouponDetails);

module.exports = router;

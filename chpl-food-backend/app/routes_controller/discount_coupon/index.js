const router = require('express').Router();
const auth = require('../../middlewares/CustomerMiddlewear');
const controller = require('./lib/controller');
const { redeemCouponValidation, createCouponValidation } = require('./lib/validation');

// Create a new discount coupon
router.post('/create-coupon', auth, createCouponValidation, controller.create);

// Redeem a discount coupon
router.post('/redeem-coupon', auth, redeemCouponValidation, controller.redeemCoupon);

module.exports = router;

const { body } = require('express-validator');

exports.redeemCouponValidation = [
    body('billId').notEmpty().withMessage('Bill ID is required'),

    body('couponCode').notEmpty().withMessage('Coupon code is required').isString().withMessage('Coupon code must be a string').trim(),
];

exports.createCouponValidation = [
    body('code').notEmpty().withMessage('Coupon code is required'),

    body('type')
        .notEmpty()
        .withMessage('Coupon type is required')
        .isIn(['flat', 'percent'])
        .withMessage('Coupon type must be "flat" or "percent"'),

    body('value')
        .notEmpty()
        .withMessage('Coupon value is required')
        .isFloat({ gt: 0 })
        .withMessage('Coupon value must be a number greater than 0'),

    body('maxUsage').notEmpty().withMessage('Maximum usage is required').isInt({ min: 1 }).withMessage('Maximum usage must be at least 1'),

    body('validFrom').notEmpty().withMessage('Valid from date is required'),

    body('validTo').notEmpty().withMessage('Valid to date is required'),

    body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean'),

    body('description').optional().isString().withMessage('Description must be a string'),

    body('customerIds').optional().isArray().withMessage('customerIds must be an array'),
];

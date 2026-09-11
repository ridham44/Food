const { body } = require('express-validator');
const db = require('../../../db/models');

exports.createRazorpayOrderValidation = () => {
    return [
        body('tenantId')
            .notEmpty()
            .withMessage('tenantId is required')
            .isUUID()
            .withMessage('tenantId must be a valid UUID')
            .custom(async (tenantId) => {
                const tenant = await db.Tenant.findByPk(tenantId);
                if (!tenant) throw new Error('Tenant does not exist');
                return true;
            }),
        body('items').isArray({ min: 1 }).withMessage('items must be a non-empty array'),
        body('items.*.quantity').isInt({ min: 1 }).withMessage('Each item needs a quantity of at least 1'),
        body('isParcel').optional().isIn(['0', '1']).withMessage('isParcel must be "0" or "1"'),
        body('orderType').optional().isIn(['dine_in', 'takeaway', 'delivery']).withMessage('Invalid orderType'),
        body('deliveryAddressId')
            .if(body('orderType').equals('delivery'))
            .notEmpty()
            .withMessage('deliveryAddressId is required for delivery orders')
            .isUUID()
            .withMessage('deliveryAddressId must be a valid UUID'),
        body('couponCode').optional().isString(),
    ];
};

exports.verifyPaymentValidation = () => {
    return [
        body('pendingPaymentId').notEmpty().withMessage('pendingPaymentId is required').isUUID(),
        body('razorpay_order_id').notEmpty().withMessage('razorpay_order_id is required'),
        body('razorpay_payment_id').notEmpty().withMessage('razorpay_payment_id is required'),
        body('razorpay_signature').notEmpty().withMessage('razorpay_signature is required'),
    ];
};

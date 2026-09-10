const { body } = require('express-validator');

exports.redeemPointsValidation = () => {
    return [
        body('billId')
            .notEmpty().withMessage('Bill ID is required')
            .isUUID().withMessage('Bill ID must be a valid UUID'),

        body('points')
            .notEmpty().withMessage('Points are required')
            .isInt({ min: 1 }).withMessage('Points must be a positive integer'),
    ];
};

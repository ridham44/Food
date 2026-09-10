const { body } = require('express-validator');

exports.createValidation = () => {
    return [
        body('gst').notEmpty().isDecimal().withMessage('GST is required and must be a number'),
        body('packingFee').notEmpty().isDecimal().withMessage('Packing Fee is required and must be a number'),
        body('status').notEmpty().isIn(['0', '1']).withMessage('Status must be 0 or 1'),
    ];
};

exports.updateValidation = () => {
    return [
        body('gst').notEmpty().isDecimal().withMessage('GST must be a number'),
        body('packingFee').notEmpty().isDecimal().withMessage('Packing Fee must be a number'),
        body('status').optional().isIn(['0', '1']).withMessage('Status must be 0 or 1'),
    ];
};

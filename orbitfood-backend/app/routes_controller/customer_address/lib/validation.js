const { body } = require('express-validator');

exports.addressValidation = () => {
    return [
        body('contactName').notEmpty().withMessage('contactName is required').trim(),
        body('contactPhone').notEmpty().withMessage('contactPhone is required').trim(),
        body('addressLine').notEmpty().withMessage('addressLine is required').trim(),
        body('label').optional().isString().isLength({ max: 20 }),
        body('countryId').optional({ nullable: true }).isUUID(),
        body('stateId').optional({ nullable: true }).isUUID(),
        body('cityId').optional({ nullable: true }).isUUID(),
        body('pincode').optional({ nullable: true }).isString().isLength({ max: 10 }),
        body('isDefault').optional().isBoolean(),
    ];
};

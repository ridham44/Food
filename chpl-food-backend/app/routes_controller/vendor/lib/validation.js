const { body } = require('express-validator');

exports.statusUpdateVendorValidation = () => {
    return [body('status').isIn(['0', '1']).withMessage('Status must be either "0" (inactive) or "1" (active)')];
};
exports.updateVendorValidation = () => {
    return [
        body('name').optional().isString().withMessage('Vendor name must be a string'),
        body('contactPerson').optional().isString().withMessage('Contact person must be a string'),
        body('phone').optional().isString().withMessage('Phone must be a string'),
        body('email').optional().isEmail().withMessage('Email must be valid'),
        body('address').optional().isString().withMessage('Address must be a string'),
        body('note').optional().isString().withMessage('Note must be a string'),
        body('status').optional().isIn(['0', '1']).withMessage('Status must be either "0" (inactive) or "1" (active)'),
    ];
};

exports.createVendorValidation = () => {
    return [
        body('name').notEmpty().withMessage('Vendor name is required'),

        body('contactPerson').notEmpty().withMessage('Contact person is required'),

        body('phone').notEmpty().withMessage('Phone number is required').isMobilePhone().withMessage('Phone number must be valid'),

        body('email').optional().isEmail().withMessage('Email must be valid'),

        body('address').notEmpty().withMessage('Address is required'),

        body('note').optional().isString().withMessage('Note must be a string'),

        body('items').isArray({ min: 1 }).withMessage('At least one item is required'),

        body('items.*.ingredientName').notEmpty().withMessage('Ingredient name is required'),

        body('items.*.costPerUnit')
            .notEmpty()
            .withMessage('Cost per unit is required')
            .isFloat({ min: 0 })
            .withMessage('Cost per unit must be a non-negative number'),

        body('items.*.unit').notEmpty().withMessage('Unit is required'),

        body('items.*.category').optional().isString().withMessage('Category must be a string'),
    ];
};

exports.createVendorItemValidation = () => {
    return [
        body('ingredientName').trim().notEmpty().withMessage('Ingredient name is required'),

        body('costPerUnit').isFloat({ gt: 0 }).withMessage('Cost per unit must be a positive number'),

        body('unit').trim().notEmpty().withMessage('Unit is required'),

        body('category').trim().notEmpty().withMessage('Category is required'),
    ];
};

exports.updateVendorItemValidation = () => {
    return [
        body('ingredientName').optional().trim().notEmpty().withMessage('Ingredient name cannot be empty'),

        body('costPerUnit').optional().isFloat({ gt: 0 }).withMessage('Cost per unit must be a positive number'),

        body('unit').optional().trim().notEmpty().withMessage('Unit cannot be empty'),

        body('category').optional().trim().notEmpty().withMessage('Category cannot be empty'),
    ];
};

exports.statusUpdateVendorItemValidation = () => {
    return [body('status').isBoolean().withMessage('Status must be true or false')];
};

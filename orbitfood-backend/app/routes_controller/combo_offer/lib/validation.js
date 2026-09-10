const { body } = require('express-validator');

exports.validateCreateComboGroup = () => {
    return [
        body('name').notEmpty().withMessage('name is required').trim(),

        body('comboPrice').notEmpty().withMessage('comboPrice is required').isNumeric().withMessage('comboPrice must be a number'),

        body('items').isArray({ min: 1 }).withMessage('items must be a non-empty array'),

        body('items.*.menuId')
            .notEmpty()
            .withMessage('menuId is required for each item')
            .isUUID()
            .withMessage('menuId must be a valid UUID'),

        body('items.*.quantity')
            .notEmpty()
            .withMessage('quantity is required for each item')
            .isInt({ min: 1 })
            .withMessage('quantity must be a positive integer'),

        body('items.*.type')
            .notEmpty()
            .withMessage('type is required for each item')
            .isIn(['buy', 'get'])
            .withMessage('type must be either "buy" or "get"'),
    ];
};

exports.validateComboGroupItem = () => {
    return [
        body('comboGroupId').notEmpty().withMessage('comboGroupId is required').isUUID().withMessage('comboGroupId must be a valid UUID'),

        body('menuId').notEmpty().withMessage('menuId is required').isUUID().withMessage('menuId must be a valid UUID'),

        body('quantity')
            .notEmpty()
            .withMessage('quantity is required')
            .isInt({ min: 1 })
            .withMessage('quantity must be a positive integer'),

        body('type').notEmpty().withMessage('type is required').isIn(['buy', 'get']).withMessage('type must be either "buy" or "get"'),
    ];
};

exports.validateUpdateComboGroupItem = () => {
    return [
        body('quantity')
            .optional()
            .notEmpty()
            .withMessage('quantity cannot be empty if provided')
            .isInt({ min: 1 })
            .withMessage('quantity must be a positive integer'),

        body('type')
            .optional()
            .notEmpty()
            .withMessage('type cannot be empty if provided')
            .isIn(['buy', 'get'])
            .withMessage('type must be either "buy" or "get"'),
    ];
};

exports.validateUpdateComboGroup = () => {
    return [
        body('name').optional().notEmpty().withMessage('name cannot be empty').trim(),

        body('isActive').optional().isIn(['0', '1']).withMessage('isActive must be "0" (inactive) or "1" (active)'),

        body('price').optional().notEmpty().withMessage('price cannot be empty').isNumeric().withMessage('price must be a valid number'),
    ];
};

const { body } = require('express-validator');

exports.validationRules = () => [
    body('roleId').notEmpty().withMessage('roleId is required').isUUID().withMessage('roleId must be a valid UUID'),

    body('menu_adminIds').isArray({ min: 1 }).withMessage('menu_adminIds must be a non-empty array'),

    body('menu_adminIds.*').isUUID().withMessage('Each menu_adminId must be a valid UUID'),
];

exports.updateValidations = () => [body('menu_adminId').optional().notEmpty().withMessage('menu_adminId must not be empty if provided')];

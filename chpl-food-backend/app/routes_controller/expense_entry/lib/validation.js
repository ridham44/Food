const { body } = require('express-validator');

const createExpenseValidation = () => {
    return [
        body('title')
            .notEmpty()
            .trim()
            .withMessage('Title is required!'),

        body('amount')
            .notEmpty()
            .withMessage('Amount is required!')
            .isFloat({ gt: 0 })
            .withMessage('Amount must be a positive number!'),

        body('date')
            .notEmpty()
            .isISO8601()
            .withMessage('Date must be a valid date (YYYY-MM-DD)!'),

        body('category')
            .optional()
            .isIn(['Kitchen', 'Maintenance', 'Utilities', 'Other'])
            .withMessage('Invalid category!'),

        body('payment_mode')
            .optional()
            .isIn(['Cash', 'Card', 'UPI', 'Bank Transfer', 'Other'])
            .withMessage('Invalid payment mode!'),

        body('remarks')
            .optional()
            .trim(),
    ];
};

const updateExpenseValidation = () => {
    return [
        body('title')
            .optional()
            .notEmpty()
            .trim()
            .withMessage('Title cannot be empty!'),

        body('amount')
            .optional()
            .isFloat({ gt: 0 })
            .withMessage('Amount must be a positive number!'),

        body('date')
            .optional()
            .isISO8601()
            .withMessage('Date must be a valid date!'),

        body('category')
            .optional()
            .isIn(['Kitchen', 'Maintenance', 'Utilities', 'Other'])
            .withMessage('Invalid category!'),

        body('payment_mode')
            .optional()
            .isIn(['Cash', 'Card', 'UPI', 'Bank Transfer', 'Other'])
            .withMessage('Invalid payment mode!'),

        body('remarks')
            .optional()
            .trim(),
    ];
};

module.exports = {
    createExpenseValidation,
    updateExpenseValidation,
};

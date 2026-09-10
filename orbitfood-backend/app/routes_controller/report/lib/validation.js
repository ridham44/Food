const { body } = require('express-validator');

const dateRegex = /^\d{4}(\/\d{2})?(\/\d{2})?$/;

const dateValidation = () => {
    return [
        body('startDate').optional().matches(dateRegex).withMessage('Invalid startDate format. Use YYYY or YYYY/MM or YYYY/MM/DD'),

        body('endDate').optional().matches(dateRegex).withMessage('Invalid endDate format. Use YYYY or YYYY/MM or YYYY/MM/DD'),
    ];
};

const validategetOrder = () => {
    return [body('orderListId').notEmpty().withMessage('Order List ID is required')];
};

module.exports = { dateValidation, validategetOrder };

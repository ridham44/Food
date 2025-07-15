const { body } = require('express-validator');

const paymentValidation = () => {
    return [
        body('customerMobile')
            .notEmpty()
            .withMessage('Customer mobile is required')
            .isMobilePhone()
            .withMessage('Enter a valid mobile number'),

        body('cash').optional().isFloat({ min: 0 }).withMessage('Cash must be a non-negative number'),

        body('card').optional().isFloat({ min: 0 }).withMessage('Card must be a non-negative number'),

        body('online').optional().isFloat({ min: 0 }).withMessage('Online must be a non-negative number'),
    ];
};
const unpaidbillsvalidation = () => {
    return [
        body('customerMobile')
            .notEmpty()
            .withMessage('Customer mobile is required')
            .isMobilePhone()
            .withMessage('Enter a valid mobile number'),
    ];
}
const dateRegex = /^\d{4}(\/\d{2})?(\/\d{2})?$/;

const dateValidation = () => {
    return [
        body('startDate').optional().matches(dateRegex).withMessage('Invalid startDate format. Use YYYY or YYYY/MM or YYYY/MM/DD'),

        body('endDate').optional().matches(dateRegex).withMessage('Invalid endDate format. Use YYYY or YYYY/MM or YYYY/MM/DD'),
    ];
};

module.exports = {
    paymentValidation,
    dateValidation,
    unpaidbillsvalidation
};

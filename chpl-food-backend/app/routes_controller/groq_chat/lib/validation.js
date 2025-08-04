const { body } = require('express-validator');

const askAiValidation = () => {
    return [body('question').notEmpty().withMessage('question is required')];
};

module.exports = { askAiValidation };

const { body } = require('express-validator');

const askAiValidation = () => {
    return [
        body('question')
            .trim()
            .notEmpty()
            .withMessage('question is required')
            .isLength({ max: 800 })
            .withMessage('question must be 800 characters or fewer'),
    ];
};

module.exports = { askAiValidation };

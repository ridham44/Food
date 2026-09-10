const { body } = require('express-validator');
const db = require('../../../db/models');
const validationRules = () => {
    return [
        body('name')
            .notEmpty()
            .trim()
            .withMessage('Name is required')
            .custom(async (value) => {
                try {
                    const state = await db.GeoState.findOne({ where: { name: value } });
                    if (state) {
                        return Promise.reject('State already exists!');
                    }
                    return true;
                } catch (error) {
                    return Promise.reject('Something went wrong!');
                }
            }),
    ];
};
const updateValidations = () => {
    return [body('name').notEmpty().trim().withMessage('Name is required')];
};
module.exports = { validationRules, updateValidations };

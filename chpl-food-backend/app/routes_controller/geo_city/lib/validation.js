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
                    const city = await db.GeoCity.findOne({ where: { name: value } });
                    if (city) {
                        return Promise.reject('City already exists!!');
                    }
                    return true;
                } catch (error) {
                    return Promise.reject('Something went wrong!');
                }
            }),
    ];
};
const updateValidations = () => {
    return [body('name').notEmpty().trim().withMessage('Name is required!')];
};
module.exports = { validationRules, updateValidations };

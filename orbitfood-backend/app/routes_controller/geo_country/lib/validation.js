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
                    const country = await db.GeoCountry.findOne({ where: { name: value } });
                    if (country) {
                        return Promise.reject('Country already exists!');
                    }
                    return true;
                } catch (error) {
                    return Promise.reject('Something went wrong!');
                }
            }),
        body('countryCode').notEmpty().trim().withMessage('Country Code is required'),
        body('currencyCode').notEmpty().trim().withMessage('Currency Code is required'),
        body('telephonePrefix').notEmpty().trim().withMessage('Telephone Prefix is required'),
    ];
};
const updateValidations = () => {
    return [body('name').notEmpty().trim().withMessage('Name is required')];
};
module.exports = { validationRules, updateValidations };

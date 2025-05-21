// path: modules/tenant/lib/validation.js

const { body } = require('express-validator');
const db = require('../../../db/models');

const validationRules = () => {
    return [
        body('shortCode')
            .notEmpty()
            .withMessage('Short code is required'),

        body('companyName')
            .notEmpty()
            .withMessage('Company name is required'),

        body('mobile')
            .notEmpty()
            .withMessage('Mobile number is required'),

        body('email')
            .notEmpty()
            .withMessage('Email is required')
            .isEmail()
            .withMessage('Invalid email format')
            .custom(async (value) => {
                const tenant = await db.Tenant.findOne({ where: { email: value.toLowerCase() } });
                if (tenant) {
                    return Promise.reject('Email already exists!');
                }
                return true;
            }),

        body('status')
            .optional()
            .isIn(['0', '1', '2', '3'])
            .withMessage('Invalid status. Allowed values: 0 (Pending), 1 (Approved), 2 (InProgress), 3 (Rejected)'),

        body('countryId')
            .optional()
            .custom(async (value) => {
                if (value) {
                    const country = await db.GeoCountry.findByPk(value);
                    if (!country) throw new Error('Invalid country ID');
                }
                return true;
            }),

        body('stateId')
            .optional()
            .custom(async (value) => {
                if (value) {
                    const state = await db.GeoState.findByPk(value);
                    if (!state) throw new Error('Invalid state ID');
                }
                return true;
            }),

        body('cityId')
            .optional()
            .custom(async (value) => {
                if (value) {
                    const city = await db.GeoCity.findByPk(value);
                    if (!city) throw new Error('Invalid city ID');
                }
                return true;
            }),
    ];
};

const updateValidations = () => {
    return [
        body('shortCode')
            .optional()
            .notEmpty()
            .withMessage('Short code cannot be empty'),

        body('companyName')
            .optional()
            .notEmpty()
            .withMessage('Company name cannot be empty'),

        body('mobile')
            .optional()
            .notEmpty()
            .withMessage('Mobile number cannot be empty'),

        body('email')
            .optional()
            .isEmail()
            .withMessage('Invalid email format')
            .custom(async (value, { req }) => {
                const tenant = await db.Tenant.findOne({
                    where: {
                        email: value.toLowerCase(),
                        id: { [db.Sequelize.Op.ne]: req.params.id },
                    },
                });
                if (tenant) {
                    return Promise.reject('Another tenant with this email already exists!');
                }
                return true;
            }),

        body('status')
            .optional()
            .isIn(['0', '1', '2', '3'])
            .withMessage('Invalid status. Allowed values: 0 (Pending), 1 (Approved), 2 (InProgress), 3 (Rejected)'),
    ];
};

module.exports = {
    validationRules,
    updateValidations,
};

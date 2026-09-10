const { body } = require('express-validator');
const db = require('../../../db/models');

const customerLoginValidator = [
    body('identifier')
        .notEmpty().withMessage('Identifier (email or mobile) is required.')
        .custom(value => {
            if (!/^\S+@\S+\.\S+$/.test(value) && !/^[0-9]{8,15}$/.test(value)) {
                throw new Error('Identifier must be a valid email or mobile number.');
            }
            return true;
        }),
    body('otp')
        .notEmpty().withMessage('OTP is required.')
        .isLength({ min: 4, max: 4 }).withMessage('OTP must be 4 digits.')
        .matches(/^\d+$/).withMessage('OTP must contain only digits.'),
];

const createCustomerValidator = [
    body('firstName').notEmpty().withMessage('First name is required.'),
    body('lastName').notEmpty().withMessage('Last name is required.'),
    body('gender')
        .notEmpty().withMessage('Gender is required.')
        .isIn(['male', 'female']).withMessage('Gender must be "male" or "female".'),
    body('email')
        .isEmail().withMessage('Invalid email format.'),
    body('phoneNo')
        .notEmpty().withMessage('Phone number is required.')
        .isLength({ min: 8, max: 15 }).withMessage('Phone number must be 8–15 digits.'),
    body('address')
        .isString().withMessage('Address must be a string.'),
    body('cityId')
        .isUUID().withMessage('Invalid city ID.'),
    body('stateId')
        .isUUID().withMessage('Invalid state ID.'),
    body('countryCode')
        .isLength({ max: 5 }).withMessage('Country code must be max 5 characters.'),
    body('birthDate')
        .isISO8601().withMessage('Birthdate must be in YYYY-MM-DD format.'),
];

const validateUpdate = [
    body('firstName').optional().isString().isLength({ max: 20 }).withMessage('Invalid first name'),
    body('lastName').optional().isString().isLength({ max: 20 }).withMessage('Invalid last name'),
    body('email').optional().isEmail().withMessage('Invalid email'),
    body('phoneNo').optional().isLength({ min: 8, max: 15 }).withMessage('Invalid phone number'),
    body('gender').optional().isIn(['male', 'female']).withMessage('Invalid gender'),
    body('birthDate').optional().isISO8601().toDate().withMessage('Invalid birth date'),
    body('countryCode').optional().isString().isLength({ max: 5 }),

    body('countryId').optional().isUUID().withMessage('Invalid countryId format')
        .bail()
        .custom(async (value) => {
            const country = await db.GeoCountry.findByPk(value);
            if (!country) {
                return Promise.reject('Invalid country ID!');
            }
        }),

    body('stateId').optional().isUUID().withMessage('Invalid stateId format')
        .bail()
        .custom(async (value) => {
            const state = await db.GeoState.findByPk(value);
            if (!state) {
                return Promise.reject('Invalid state ID!');
            }
        }),

    body('cityId').optional().isUUID().withMessage('Invalid cityId format')
        .bail()
        .custom(async (value) => {
            const city = await db.GeoCity.findByPk(value);
            if (!city) {
                return Promise.reject('Invalid city ID!');
            }
        }),

    body('roleId').optional().isUUID().withMessage('Invalid roleId'),
];

module.exports = {
    customerLoginValidator,
    createCustomerValidator,
    validateUpdate,
};

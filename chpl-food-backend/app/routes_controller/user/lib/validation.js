const { body } = require('express-validator');

const loginRules = () => {
    return [
        body('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Enter valid email.'),
        body('password').notEmpty().withMessage('Password is required'),
    ];
};

const loginWithAuthRules = () => {
    return [
        body('accessToken').notEmpty().withMessage('Access Token is required'),
        body('type').trim().notEmpty().withMessage('Type is required.'),
    ];
};

const createUserRules = () => {
    return [
        body('firstName').notEmpty().trim().withMessage('First Name is required.'),
        body('lastName').notEmpty().trim().withMessage('Last Name is required.'),
        body('mobile')
            .notEmpty()
            .trim()
            .withMessage('Mobile is required.')
            .isMobilePhone(['en-IN'])
            .withMessage('Enter a valid Mobile Number.'),
        body('email').trim().notEmpty().withMessage('Email is required.').isEmail().withMessage('Enter a valid email'),
        body('password')
            .notEmpty()
            .trim()
            .withMessage('Password is required field')
            .isLength({ min: 8 })
            .withMessage('Minimum 8 characters is required'),
        body('roleId').notEmpty().withMessage('Role is required.'),
        body('gender')
            .notEmpty()
            .withMessage('Gender is required.')
            .custom((value) => {
                if (value !== 'male' && value !== 'female') return Promise.reject('Gender must be male or female!');
                return true;
            }),
    ];
};

const updateUserRules = () => {
    return [
        body('firstName').notEmpty().trim().withMessage('First Name is required.'),
        body('lastName').notEmpty().trim().withMessage('Last Name is required.'),
        body('mobile')
            .notEmpty()
            .trim()
            .withMessage('Mobile is required.')
            .isMobilePhone(['en-IN'])
            .withMessage('Enter a valid Mobile Number.'),
        body('email').trim().notEmpty().withMessage('Email is required.').isEmail().withMessage('Enter a valid email'),
        body('roleId').notEmpty().withMessage('Role is required.'),
        body('gender')
            .notEmpty()
            .withMessage('Gender is required.')
            .custom((value) => {
                if (value != 'male' && value != 'female') return Promise.reject('Gender must be male or female!');
                return true;
            }),
    ];
};

const changePassword = () => {
    return [
        body('oldPassword')
            .notEmpty()
            .trim()
            .withMessage('Old Password is required')
            .isLength({ min: 8 })
            .withMessage('Minimum 8 characters is required'),
        body('newPassword')
            .notEmpty()
            .trim()
            .withMessage('New Password is required.')
            .isLength({ min: 8 })
            .withMessage('Minimum 8 characters is required'),
        body('confirmPassword')
            .notEmpty()
            .trim()
            .withMessage('Confirm Password is required.')
            .isLength({ min: 8 })
            .withMessage('Minimum 8 characters is required'),
    ];
};

module.exports = {
    loginRules,
    createUserRules,
    updateUserRules,
    loginWithAuthRules,
    changePassword,
};

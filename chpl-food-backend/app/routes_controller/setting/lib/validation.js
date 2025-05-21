const { body } = require('express-validator');
const db = require('../../../db/models');

const validationRules = () => {
    return [
        body('title').notEmpty().trim().withMessage('Title is required'),

        body('key')
            .notEmpty()
            .trim()
            .withMessage('Key is required')
            .custom(async (value) => {
                try {
                    const setting = await db.Setting.findOne({ where: { key: value } });
                    if (setting) {
                        return Promise.reject('Setting with this key already exists!');
                    }
                    return true;
                } catch (error) {
                    return Promise.reject('Something went wrong while checking the key!');
                }
            }),

        body('value').optional().isString().withMessage('Value must be a string'),

        body('status')
            .notEmpty()
            .withMessage('Status is required')
            .isIn(['0', '1'])
            .withMessage('Invalid status. Allowed values: 0 (Inactive), 1 (Active)'),

        body('remark').optional().isString().withMessage('Remark must be a string'),
    ];
};

const updateValidations = () => {
    return [
        body('title').notEmpty().trim().withMessage('Title is required'),

        body('key')
            .notEmpty()
            .trim()
            .withMessage('Key is required')
            .custom(async (value, { req }) => {
                try {
                    const setting = await db.Setting.findOne({
                        where: {
                            key: value,
                            id: { [db.Sequelize.Op.ne]: req.params.id },
                        },
                    });
                    if (setting) {
                        return Promise.reject('Another setting with this key already exists!');
                    }
                    return true;
                } catch (error) {
                    return Promise.reject('Something went wrong while validating the key!');
                }
            }),

        body('value').optional().isString().withMessage('Value must be a string'),

        body('status').optional().isIn(['0', '1']).withMessage('Invalid status. Allowed values: 0 (Inactive), 1 (Active)'),

        body('remark').optional().isString().withMessage('Remark must be a string'),
    ];
};

module.exports = {
    validationRules,
    updateValidations,
};

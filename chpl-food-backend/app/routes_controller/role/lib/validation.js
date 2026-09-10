const { body } = require('express-validator');
const db = require('../../../db/models');

const validationRules = () => {
    return [
        body('name')
            .notEmpty()
            .trim()
            .withMessage('Role name is required')
            .custom(async (value, { req }) => {
                try {
                    const role = await db.Role.findOne({ where: { name: value, tenantId: req.user?.tenantId ?? null } });
                    if (role) {
                        return Promise.reject('Role already exists!');
                    }
                    return true;
                } catch (error) {
                    return Promise.reject('Something went wrong!');
                }
            }),

        body('type')
            .notEmpty()
            .withMessage('Type is required')
            .isIn(['1', '2', '3'])
            .withMessage('Invalid type. Allowed values: 1 (Admin), 2 (Tenant), 3 (Customer)'),

        body('isAdmin').notEmpty().withMessage('isAdmin is required').isBoolean().withMessage('isAdmin must be true or false'),

        body('status')
            .notEmpty()
            .withMessage('Status is required')
            .isIn(['0', '1'])
            .withMessage('Invalid status. Allowed values: 0 (Inactive), 1 (Active)'),

        body('tenantId')
            .optional({ nullable: true })
            .custom(async (value) => {
                if (value) {
                    const tenant = await db.Tenant.findByPk(value);
                    if (!tenant) {
                        return Promise.reject('Invalid tenant ID');
                    }
                }
                return true;
            }),
    ];
};

const updateValidations = () => {
    return [
        body('name').notEmpty().withMessage('Role name is required').trim(),

        body('type').optional().isIn(['1', '2', '3']).withMessage('Invalid type. Allowed values: 1 (Admin), 2 (Tenant), 3 (Customer)'),

        body('isAdmin').optional().isBoolean().withMessage('isAdmin must be true or false'),

        body('status').optional().isIn(['0', '1']).withMessage('Invalid status. Allowed values: 0 (Inactive), 1 (Active)'),

        body('tenantId')
            .optional({ nullable: true })
            .custom(async (value) => {
                if (value) {
                    const tenant = await db.Tenant.findByPk(value);
                    if (!tenant) {
                        return Promise.reject('Invalid tenant ID');
                    }
                }
                return true;
            }),
    ];
};

module.exports = {
    validationRules,
    updateValidations,
};

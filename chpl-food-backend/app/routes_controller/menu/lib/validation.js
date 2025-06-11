const { body } = require('express-validator');
const db = require('../../../db/models');

const validationRules = () => {
    return [
        body('name')
            .notEmpty()
            .trim()
            .withMessage('Menu name is required')
            .custom(async (value, { req }) => {
                const existing = await db.Menu.findOne({
                    where: { name: value, tenantId: req.body.tenantId },
                });
                if (existing) {
                    return Promise.reject('Menu with this name already exists for this tenant.');
                }
                return true;
            }),
        body('perentId')
            .optional({ nullable: true })
            .custom(async (value) => {
                if (value) {
                    const parentMenu = await db.Menu.findByPk(value);
                    if (!parentMenu) {
                        return Promise.reject('Invalid parent menu ID');
                    }
                }
                return true;
            }),

        body('price').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Price must be a positive number'),

        body('filePath').optional({ nullable: true }).isString().withMessage('File path must be a string'),
    ];
};

const updateValidations = () => {
    return [
        body('name')
            .notEmpty()
            .trim()
            .withMessage('Menu name is required')
            .custom(async (value, { req }) => {
                const existing = await db.Menu.findOne({
                    where: {
                        name: value,
                        tenantId: req.body.tenantId,
                        id: { [db.Sequelize.Op.ne]: req.params.id },
                    },
                });
                if (existing) {
                    return Promise.reject('Another menu with this name already exists for this tenant.');
                }
                return true;
            }),


        body('perentId')
            .optional({ nullable: true })
            .custom(async (value) => {
                if (value) {
                    const parentMenu = await db.Menu.findByPk(value);
                    if (!parentMenu) {
                        return Promise.reject('Invalid parent menu ID');
                    }
                }
                return true;
            }),

        body('price').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Price must be a positive number'),

        body('filePath').optional({ nullable: true }).isString().withMessage('File path must be a string'),
    ];
};

module.exports = {
    validationRules,
    updateValidations,
};

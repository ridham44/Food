const { body } = require('express-validator');
const db = require('../../../db/models');

exports.validateTenantId = [
    body('tenantId')
        .notEmpty()
        .withMessage('tenantId is required')
        .isUUID()
        .withMessage('tenantId must be a valid UUID')
        .custom(async (tenantId) => {
            const tenant = await db.Tenant.findByPk(tenantId);
            if (!tenant) {
                throw new Error('Tenant does not exist');
            }
            return true;
        }),
];

exports.approvedorder = () => [
    body('orderListId')
        .notEmpty()
        .withMessage('orderListId is required')
        .bail()
        .custom(async (orderListId, { req }) => {
            const tenantId = req.user?.tenantId;
            if (!tenantId) {
                throw new Error('Tenant authentication required');
            }

            const order = await db.OrderList.findOne({
                where: {
                    id: orderListId,
                    tenantId,
                    status: '1',
                },
            });

            if (!order) {
                throw new Error('Order not found, not pending, or does not belong to tenant');
            }

            return true;
        }),

    body('status')
        .notEmpty()
        .withMessage('status is required')
        .isIn(['2', '3'])
        .withMessage('status must be either 2 (approved) or 3 (rejected)'),
];

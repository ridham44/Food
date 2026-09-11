'use strict';

module.exports = (sequelize, Sequelize) => {
    const RazorpayOrder = sequelize.define(
        'RazorpayOrder',
        {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            razorpayOrderId: {
                type: Sequelize.STRING(64),
                allowNull: false,
                unique: true,
            },
            customerId: {
                type: Sequelize.UUID,
                allowNull: false,
                association: {
                    model: 'Customer',
                    key: 'id',
                    belongsToAlias: 'Customer',
                    hasManyAlias: 'RazorpayOrder',
                },
            },
            tenantId: {
                type: Sequelize.UUID,
                allowNull: false,
                association: {
                    model: 'Tenant',
                    key: 'id',
                    belongsToAlias: 'Tenant',
                    hasManyAlias: 'RazorpayOrder',
                },
            },
            cartSnapshot: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            amount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
            },
            currency: {
                type: Sequelize.STRING(10),
                allowNull: false,
                defaultValue: 'INR',
            },
            status: {
                type: Sequelize.ENUM('created', 'paid', 'completed', 'failed', 'expired'),
                allowNull: false,
                defaultValue: 'created',
            },
            orderListId: {
                type: Sequelize.UUID,
                allowNull: true,
                association: {
                    model: 'OrderList',
                    key: 'id',
                    belongsToAlias: 'OrderList',
                    hasManyAlias: 'RazorpayOrder',
                },
            },
            razorpayPaymentId: {
                type: Sequelize.STRING(64),
                allowNull: true,
            },
            failureReason: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            createdAt: Sequelize.DATE,
            updatedAt: Sequelize.DATE,
        },
        {
            tableName: 'razorpay_order',
            timestamps: false,
        }
    );

    RazorpayOrder.hasTenantCondition(false);

    return RazorpayOrder;
};

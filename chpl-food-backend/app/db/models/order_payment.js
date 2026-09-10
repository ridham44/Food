'use strict';
module.exports = (sequelize, Sequelize) => {
    const OrderPayment = sequelize.define(
        'OrderPayment',
        {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            orderBillId: {
                type: Sequelize.UUID,
                allowNull: false,
                association: {
                    model: 'OrderBill',
                    key: 'id',
                    belongsToAlias: 'OrderBill',
                    hasManyAlias: 'OrderPayment',
                },
            },
            cash: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true,
            },
            card: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true,
            },
            online: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true,
            },
            amountPaid: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
            },
            status: {
                type: Sequelize.ENUM('paid', 'failed'),
                allowNull: false,
                defaultValue: 'paid',
            },
            createdAt: Sequelize.DATE,
        },
        {
            tableName: 'order_payment',
            timestamps: false, 
        }
    );
    OrderPayment.hasTenantCondition(false);
    return OrderPayment;
};

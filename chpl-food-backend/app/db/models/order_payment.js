'use strict';
module.exports = (sequelize, DataTypes) => {
    const OrderPayment = sequelize.define(
        'OrderPayment',
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            orderBillId: {
                type: DataTypes.UUID,
                allowNull: false,
                association: {
                    model: 'OrderBill',
                    key: 'id',
                    belongsToAlias: 'OrderBill',
                    hasManyAlias: 'OrderPayment',
                },
            },
            cash: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true,
            },
            card: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true,
            },
            online: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true,
            },
            amountPaid: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
            },
            status: {
                type: DataTypes.ENUM('paid', 'failed'),
                allowNull: false,
                defaultValue: 'paid',
            },
            createdAt: DataTypes.DATE,
        },
        {
            tableName: 'order_payment',
            timestamps: false, 
        }
    );
    OrderPayment.hasTenantCondition(false);
    return OrderPayment;
};

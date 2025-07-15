'use strict';

module.exports = (sequelize, DataTypes) => {
    const OrderBill = sequelize.define(
        'OrderBill',
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            orderListId: {
                type: DataTypes.UUID,
                allowNull: false,
                association: {
                    model: 'OrderList',
                    key: 'id',
                    belongsToAlias: 'OrderList',
                    hasManyAlias: 'OrderBill',
                },
            },
            totalAmount: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
            },
            couponCode: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            discountAmount: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true,
                defaultValue: 0,
            },
            finalAmount: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true,
            },
            status: {
                type: DataTypes.ENUM('0', '1', '2'),
                defaultValue: '0',
                allowNull: false,
                comment: '0 for Unpaid, 1 for Paid, 2 for Cancelled',
            },
            createdAt: DataTypes.DATE,
        },
        {
            tableName: 'order_bill',
            timestamps: false,
        }
    );

    OrderBill.hasTenantCondition(false);
    return OrderBill;
};

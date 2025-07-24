'use strict';

module.exports = (sequelize, Sequelize) => {
    const OrderBill = sequelize.define(
        'OrderBill',
        {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            orderListId: {
                type: Sequelize.UUID,
                allowNull: false,
                association: {
                    model: 'OrderList',
                    key: 'id',
                    belongsToAlias: 'OrderList',
                    hasManyAlias: 'OrderBill',
                },
            },
            totalAmount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
            },
            couponCode: {
                type: Sequelize.STRING(50),
                allowNull: true,
            },
            discountAmount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true,
                defaultValue: 0,
            },
            finalAmount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true,
            },
            pointsUsed: {
                type:  Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 0,
            },
            status: {
                type: Sequelize.ENUM('0', '1', '2'),
                defaultValue: '0',
                allowNull: false,
                comment: '0 for Unpaid, 1 for Paid, 2 for Cancelled',
            },
            createdAt: Sequelize.DATE,
        },
        {
            tableName: 'order_bill',
            timestamps: false,
        }
    );

    OrderBill.hasTenantCondition(false);
    return OrderBill;
};

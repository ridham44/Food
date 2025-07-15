'use strict';
module.exports = (sequelize, DataTypes) => {
    const OrderItem = sequelize.define(
        'OrderItem',
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
                    hasManyAlias: 'OrderItem',
                },
            },
            menuId: {
                type: DataTypes.UUID,
                allowNull: false,
                association: {
                    model: 'Menu',
                    key: 'id',
                    belongsToAlias: 'Menu',
                    hasManyAlias: 'OrderItem',
                },
            },
            quantity: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            totalPrice: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
            },
            createdAt: DataTypes.DATE,
        },
        {
            tableName: 'order_item',
            timestamps: false,
        }
    );
    OrderItem.hasTenantCondition(false);
    return OrderItem;
};

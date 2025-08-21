'use strict';
module.exports = (sequelize, Sequelize) => {
    const OrderItem = sequelize.define(
        'OrderItem',
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
                    hasManyAlias: 'OrderItem',
                },
            },
            comboId: {
                type: Sequelize.UUID,
                allowNull: true,
                association: {
                    model: 'ComboGroup',
                    key: 'id',
                    belongsToAlias: 'ComboGroup',
                    hasManyAlias: 'OrderItem',
                },
            },
            menuId: {
                type: Sequelize.UUID,
                allowNull: true,
                association: {
                    model: 'Menu',
                    key: 'id',
                    belongsToAlias: 'Menu',
                    hasManyAlias: 'OrderItem',
                },
            },
            specialInstruction: {
                type: Sequelize.STRING(255),
                allowNull: true,
                comment: 'e.g., no onions, less spicy',
            },
            quantity: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            totalPrice: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
            },
            createdAt: Sequelize.DATE,
        },
        {
            tableName: 'order_item',
            timestamps: false,
        }
    );
    OrderItem.hasTenantCondition(false);
    return OrderItem;
};

'use strict';
module.exports = (sequelize, Sequelize) => {
    const OrderList = sequelize.define(
        'OrderList',
        {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            customerId: {
                type: Sequelize.UUID,
                allowNull: false,
                association: {
                    model: 'Customer',
                    key: 'id',
                    belongsToAlias: 'Customer',
                    hasManyAlias: 'OrderList',
                },
            },
            placedBy: {
                type: Sequelize.ENUM('1', '2'),
                allowNull: false,
                defaultValue: '1',
            },
            status: {
                type: Sequelize.ENUM('1', '2', '3'),
                allowNull: false,
                defaultValue: '1',
            },
            tenantId: {
                type: Sequelize.UUID,
                allowNull: false,
                association: {
                    model: 'Tenant',
                    key: 'id',
                    belongsToAlias: 'Tenant',
                    hasManyAlias: 'OrderList',
                },
            },
            createdAt: Sequelize.DATE,
        },
        {
            tableName: 'order_list',
            timestamps: false,
        }
    );

    OrderList.hasTenantCondition(false);

    return OrderList;
};

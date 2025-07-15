'use strict';
module.exports = (sequelize, DataTypes) => {
    const OrderList = sequelize.define(
        'OrderList',
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            customerId: {
                type: DataTypes.UUID,
                allowNull: false,
                association: {
                    model: 'Customer',
                    key: 'id',
                    belongsToAlias: 'Customer',
                    hasManyAlias: 'OrderList',
                },
            },
            placedBy: {
                type: DataTypes.ENUM('1', '2'),
                allowNull: false,
                defaultValue: '1',
            },
            status: {
                type: DataTypes.ENUM('1', '2', '3'),
                allowNull: false,
                defaultValue: '1',
            },
            tenantId: {
                type: DataTypes.UUID,
                allowNull: false,
                association: {
                    model: 'Tenant',
                    key: 'id',
                    belongsToAlias: 'Tenant',
                    hasManyAlias: 'OrderList',
                },
            },
            createdAt: DataTypes.DATE,
        },
        {
            tableName: 'order_list',
            timestamps: false,
        }
    );

    OrderList.hasTenantCondition(false);

    return OrderList;
};

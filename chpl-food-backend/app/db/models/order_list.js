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
            isParcel: {
                type: Sequelize.ENUM('0', '1'),
                allowNull: false,
                defaultValue: '0',
                comment: '1 = Parcel selected, 0 = No parcel',
            },
            cancelReason: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            cancelledBy: {
                type: Sequelize.ENUM('0', '1'),
                allowNull: true,
                comment: '0 = Customer, 1 = Tenant',
            },
            createdAt: Sequelize.DATE,
            updatedAt: Sequelize.DATE,
        },
        {
            tableName: 'order_list',
            timestamps: false,
        }
    );

    OrderList.hasTenantCondition(false);

    return OrderList;
};

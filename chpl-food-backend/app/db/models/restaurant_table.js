'use strict';
module.exports = (sequelize, Sequelize) => {
    const RestaurantTable = sequelize.define(
        'RestaurantTable',
        {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            tenantId: {
                type: Sequelize.UUID,
                allowNull: false,
                association: {
                    model: 'Tenant',
                    key: 'id',
                    belongsToAlias: 'Tenant',
                    hasManyAlias: 'RestaurantTables',
                },
            },
            tableNumber: {
                type: Sequelize.STRING(20),
                allowNull: false,
            },
            capacity: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 2,
            },
            section: {
                type: Sequelize.STRING(50),
                allowNull: true,
            },
            status: {
                type: Sequelize.ENUM('available', 'occupied', 'reserved', 'cleaning'),
                allowNull: false,
                defaultValue: 'available',
            },
            createdBy: {
                type: Sequelize.UUID,
                allowNull: true,
            },
            updatedBy: {
                type: Sequelize.UUID,
                allowNull: true,
            },
            createdAt: Sequelize.DATE,
            updatedAt: Sequelize.DATE,
        },
        {
            tableName: 'restaurant_table',
            timestamps: false,
        }
    );

    RestaurantTable.hasTenantCondition();

    return RestaurantTable;
};

'use strict';
module.exports = (sequelize, Sequelize) => {
    const InventoryItem = sequelize.define(
        'InventoryItem',
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
                    hasManyAlias: 'InventoryItems',
                },
            },
            ingredientName: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            category: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },
            unit: {
                type: Sequelize.STRING(50),
                allowNull: false,
            },
            currentStock: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0,
            },
            minimumLevel: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0,
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
            tableName: 'inventory_item',
            timestamps: false,
        }
    );

    InventoryItem.hasTenantCondition();

    return InventoryItem;
};

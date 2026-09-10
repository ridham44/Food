'use strict';
module.exports = (sequelize, Sequelize) => {
    const InventoryMovement = sequelize.define(
        'InventoryMovement',
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
                    hasManyAlias: 'InventoryMovements',
                },
            },
            inventoryItemId: {
                type: Sequelize.UUID,
                allowNull: false,
                association: {
                    model: 'InventoryItem',
                    key: 'id',
                    belongsToAlias: 'InventoryItem',
                    hasManyAlias: 'InventoryMovements',
                },
            },
            type: {
                type: Sequelize.ENUM('restock', 'usage', 'adjustment'),
                allowNull: false,
            },
            quantity: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                comment: 'Signed delta applied to currentStock',
            },
            note: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            createdBy: {
                type: Sequelize.UUID,
                allowNull: true,
            },
            createdAt: Sequelize.DATE,
        },
        {
            tableName: 'inventory_movement',
            timestamps: false,
        }
    );

    InventoryMovement.hasTenantCondition();

    return InventoryMovement;
};

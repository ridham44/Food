'use strict';

module.exports = (sequelize, Sequelize) => {
    const ComboGroup = sequelize.define(
        'ComboGroup',
        {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                defaultValue: Sequelize.UUIDV4,
                allowNull: false,
            },
            tenantId: {
                type: Sequelize.UUID,
                allowNull: false,
                association: {
                    model: 'Tenant',
                    key: 'id',
                    belongsToAlias: 'Tenant',
                    hasManyAlias: 'ComboGroups',
                },
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            isActive: {
                type: Sequelize.ENUM('0', '1'),
                allowNull: false,
                defaultValue: '1',
            },
            price: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                onCreate: sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updatedAt: {
                type: Sequelize.DATE,
                onUpdate: sequelize.literal('CURRENT_TIMESTAMP'),
            },
        },
        {
            tableName: 'combo_group',
            timestamps: false,
            underscored: false,
        }
    );

    ComboGroup.hasTenantCondition?.(false);
    return ComboGroup;
};

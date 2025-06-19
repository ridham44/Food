'use strict';

module.exports = (sequelize, Sequelize) => {
    const Permission = sequelize.define(
        'Permission',
        {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
            },
            menu_adminId: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'menu_admin',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
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
            tableName: 'permission',
            timestamps: true,
            customOptions: {
                createdBy: { value: true },
                updatedBy: { value: true },
            },
        }
    );

    Permission.hasTenantCondition(false);

    return Permission;
};

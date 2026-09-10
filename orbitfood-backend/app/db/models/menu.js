'use strict';
module.exports = (sequelize, Sequelize) => {
    const Menu = sequelize.define(
        'Menu',
        {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: Sequelize.UUIDV4,
            },
            parentId: {
                type: Sequelize.UUID,
                allowNull: true,
            },
            name: {
                type: Sequelize.STRING(50),
                allowNull: false,
            },
            price: {
                type: Sequelize.FLOAT(10, 2),
                allowNull: true,
            },
            filePath: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            description: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            tenantId: {
                type: Sequelize.UUID,
                allowNull: false,
                association: {
                    model: 'Tenant',
                    key: 'id',
                    belongsToAlias: 'Tenant',
                    hasManyAlias: 'menu',
                },
            },
            isAvailable: {
                type: Sequelize.ENUM('0', '1'),
                allowNull: false,
                defaultValue: '1',
                comment: '1 = available, 0 = unavailable',
            },

            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updatedAt: {
                type: Sequelize.DATE,
                defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
                allowNull: true,
            },
        },
        {
            tableName: 'menu',
            customOptions: {
                createdBy: { value: true },
                updatedBy: { value: true },
            },
        }
    );

    Menu.hasTenantCondition();

    return Menu;
};

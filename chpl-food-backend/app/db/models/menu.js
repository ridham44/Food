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
            tenantId: {
                type: Sequelize.UUID,
                allowNull: false,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
            },
            createdBy: {
                type: Sequelize.UUID,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
                allowNull: true,
            },
            updatedBy: {
                type: Sequelize.UUID,
                allowNull: true,
            },
        },
        {
            tableName: 'menu',
        }
    );

    Menu.hasTenantCondition();

    return Menu;
};

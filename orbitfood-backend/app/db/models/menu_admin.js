'use strict';

module.exports = (sequelize, Sequelize) => {
    const MenuAdmin = sequelize.define(
        'MenuAdmin',
        {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
            },
            name: {
                type: Sequelize.STRING(150),
                allowNull: true,
            },
            url: {
                type: Sequelize.STRING(225),
                allowNull: false,
            },
            sequence: {
                type: Sequelize.INTEGER(180),
                allowNull: true,
            },
            type: {
                type: Sequelize.ENUM('1', '2', '3'),
                defaultValue: '1',
                allowNull: false,
                comment: '1 for Group, 2 for module,3 for right ',
            },
            parentId: {
                type: Sequelize.UUID,
                allowNull: true,
                association: {
                    model: 'MenuAdmin',
                    key: 'id',
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT',
                },
            },
            key: {
                type: Sequelize.STRING(180),
                allowNull: false,
            },
            status: {
                type: Sequelize.ENUM('0', '1'),
                defaultValue: '1',
                allowNull: false,
                comment: '0 for Inactive, 1 for Active',
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
            tableName: 'menu_admin',
            timestamps: true,
            customOptions: {
                createdBy: { value: true },
                updatedBy: { value: true },
            },
        }
    );
    MenuAdmin.hasTenantCondition(false);

    return MenuAdmin;
};

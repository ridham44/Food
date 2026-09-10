'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('menu_admin', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                allowNull: false,
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
                allowNull: false,
                defaultValue: '1',
                comment: '1 for Group, 2 for module,3 for right ',
            },
            parentId: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'menu_admin',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
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
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            createdBy: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'user',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
            updatedAt: {
                allowNull: true,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updatedBy: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'user',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
        });
    },

    down: async (queryInterface) => {
        await queryInterface.dropTable('menu_admin');
    },
};

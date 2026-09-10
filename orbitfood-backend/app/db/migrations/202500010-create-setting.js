'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('setting', {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: Sequelize.UUIDV4,
            },
            title: {
                type: Sequelize.STRING(200),
                allowNull: false,
            },
            key: {
                type: Sequelize.STRING(200),
                unique: true,
                allowNull: false,
            },
            value: {
                type: Sequelize.STRING(200),
                allowNull: true,
            },
            remark: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            status: {
                type: Sequelize.ENUM('0', '1'),
                allowNull: false,
                defaultValue: '1',
                comment: '0 for Inactive, 1 for Active',
            },
            createdAt: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW,
                allowNull: false,
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
                type: Sequelize.DATE,
                allowNull: true,
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

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('setting');
    },
};

'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('log_login', {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: Sequelize.UUIDV4,
            },
            tenantId: {
                type: Sequelize.UUID,
                references: {
                    model: 'tenant',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
                allowNull: false,
            },
            logoutAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            sessionDuration: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            ipAddress: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            browserDetail: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            isLogin: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            deviceType: {
                type: Sequelize.STRING,
                allowNull: true,
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
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('log_login');
    },
};

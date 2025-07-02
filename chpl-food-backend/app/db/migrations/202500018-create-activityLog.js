'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('activityLog', {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                defaultValue: Sequelize.UUIDV4,
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'user',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
            tenant_id: {
                type: Sequelize.UUID,
                allowNull: false,
                association: {
                    model: 'Tenant',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
            module: {
                type: Sequelize.STRING(100),
                allowNull: false,
            },
            action: {
                type: Sequelize.ENUM('create', 'update', 'delete', 'statusupdate'),
                allowNull: false,
                comment: 'Action type: create, update, delete',
            },
            record_id: {
                type: Sequelize.UUID,
                allowNull: false,
            },
            value: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.fn('NOW'),
            },
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('activityLog');
    },
};

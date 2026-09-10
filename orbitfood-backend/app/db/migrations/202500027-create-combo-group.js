'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('combo_group', {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                defaultValue: Sequelize.UUIDV4,
                allowNull: false,
            },
            tenantId: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'tenant',
                    key: 'id',
                },
            },
            name: {
                type: Sequelize.STRING(50),
                allowNull: false,
            },
            price: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
            },
            isActive: {
                type: Sequelize.ENUM('0', '1'),
                defaultValue: '1',
                allowNull: false,
                Comment: 'Indicates if the combo group is active or not',
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: true,
            },
        });
    },

    down: async (queryInterface) => {
        await queryInterface.dropTable('combo_group');
    },
};

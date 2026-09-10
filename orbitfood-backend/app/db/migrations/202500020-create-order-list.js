'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('order_list', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            customerId: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'customer',
                    key: 'id',
                },
            },
            placedBy: {
                type: Sequelize.ENUM('1', '2'),
                allowNull: false,
                comment: '1 for Customer, 2 for Tenant',
            },
            status: {
                type: Sequelize.ENUM('1', '2', '3'),
                defaultValue: '1',
                allowNull: false,
                comment: '1 for Pending, 2 for Confirmed, 3 for Cancelled',
            },
            tenantId: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'tenant',
                    key: 'id',
                },
            },
            createdAt: Sequelize.DATE,
        });
    },

    down: async (queryInterface) => {
        await queryInterface.dropTable('order_list');
    },
};

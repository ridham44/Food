'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('customer_points', {
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
            totalPoints: {
                type: Sequelize.INTEGER(10),
                defaultValue: 0,
                allowNull: false,
            },
            currentOrderCount: {
                type: Sequelize.INTEGER(10),
                defaultValue: 0,
                allowNull: false,
                comment: 'Number of orders placed in current 10-order stack',
            },
            bonusPosition: {
                type: Sequelize.INTEGER(10),
                defaultValue: 0,
                allowNull: false,
                comment: 'Order number where bonus was last given in current stack (0 = not yet given)',
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
        await queryInterface.dropTable('customer_points');
    },
};

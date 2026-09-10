'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('order_bill', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            orderListId: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'order_list',
                    key: 'id',
                },
            },
            totalAmount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
            },
            status: {
                type: Sequelize.ENUM('0', '1', '2'),
                defaultValue: '0',
                allowNull: false,
                comment: '0 for Unpaid, 1 for Paid, 2 for Cancelled',
            },
            createdAt: Sequelize.DATE,
        });
    },

    down: async (queryInterface) => {
        await queryInterface.dropTable('order_bill');
    },
};

'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('order_payment', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            orderBillId: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'order_bill',
                    key: 'id',
                },
            },
            cash: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true,
            },
            card: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true,
            },
            online: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true,
            },
            amountPaid: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
            },
            status: {
                type: Sequelize.ENUM('paid', 'failed'),
                defaultValue: 'paid',
                allowNull: false,
            },
            createdAt: Sequelize.DATE,
        });
    },

    down: async (queryInterface) => {
        await queryInterface.dropTable('order_payment');
    },
};

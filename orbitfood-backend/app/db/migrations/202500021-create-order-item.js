'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('order_item', {
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
            menuId: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'menu',
                    key: 'id',
                },
            },
            quantity: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            totalPrice: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
            },
            createdAt: Sequelize.DATE,
        });
    },

    down: async (queryInterface) => {
        await queryInterface.dropTable('order_item');
    },
};

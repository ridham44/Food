('use strict');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('menu_rating', {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: Sequelize.UUIDV4,
            },
            orderId: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'order_list',
                    key: 'id',
                },
            },
            menuId: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'menu',
                    key: 'id',
                },
            },
            comboItemId: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'combo_group',
                    key: 'id',
                },
                comment: 'If part of a combo, this is the actual item ID',
            },
            customerId: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'customer',
                    key: 'id',
                },
            },
            rating: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            review: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            createdAt: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW,
            },
        });
    },

    down: async (queryInterface) => {
        await queryInterface.dropTable('menu_rating');
    },
};

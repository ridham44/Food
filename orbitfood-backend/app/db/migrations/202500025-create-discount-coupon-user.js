'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('discount_coupon_user', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            couponId: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'discount_coupon',
                    key: 'id',
                },
            },
            customerId: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'customer',
                    key: 'id',
                },
            },
            usedCount: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
                allowNull: false,
            },
        });
    },

    down: async (queryInterface) => {
        await queryInterface.dropTable('discount_coupon_user');
    },
};

'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        return Promise.all([
            queryInterface.addColumn('order_bill', 'couponCode', {
                type: Sequelize.STRING(50),
                allowNull: true,
            }),
            queryInterface.addColumn('order_bill', 'discountAmount', {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true,
                defaultValue: 0,
            }),
            queryInterface.addColumn('order_bill', 'finalAmount', {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true,
            }),
        ]);
    },

    async down(queryInterface, Sequelize) {
        return Promise.all([
            queryInterface.removeColumn('order_bill', 'couponCode'),
            queryInterface.removeColumn('order_bill', 'discountAmount'),
            queryInterface.removeColumn('order_bill', 'finalAmount'),
        ]);
    },
};

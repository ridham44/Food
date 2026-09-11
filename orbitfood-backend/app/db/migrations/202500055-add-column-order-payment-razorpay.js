'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('order_payment', 'razorpayOrderId', {
            type: Sequelize.STRING(64),
            allowNull: true,
        });
        await queryInterface.addColumn('order_payment', 'razorpayPaymentId', {
            type: Sequelize.STRING(64),
            allowNull: true,
        });
        await queryInterface.addColumn('order_payment', 'pendingPaymentId', {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
                model: 'razorpay_order',
                key: 'id',
            },
        });
    },

    down: async (queryInterface) => {
        await queryInterface.removeColumn('order_payment', 'razorpayOrderId');
        await queryInterface.removeColumn('order_payment', 'razorpayPaymentId');
        await queryInterface.removeColumn('order_payment', 'pendingPaymentId');
    },
};

'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('razorpay_order', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            razorpayOrderId: {
                type: Sequelize.STRING(64),
                allowNull: false,
                unique: true,
            },
            customerId: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'customer',
                    key: 'id',
                },
            },
            tenantId: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'tenant',
                    key: 'id',
                },
            },
            cartSnapshot: {
                type: Sequelize.TEXT,
                allowNull: false,
                comment: 'JSON: priced items, delivery address snapshot, coupon/points, tax breakdown',
            },
            amount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                comment: 'finalAmount actually sent to Razorpay, in rupees',
            },
            currency: {
                type: Sequelize.STRING(10),
                allowNull: false,
                defaultValue: 'INR',
            },
            status: {
                type: Sequelize.ENUM('created', 'paid', 'completed', 'failed', 'expired'),
                allowNull: false,
                defaultValue: 'created',
            },
            orderListId: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'order_list',
                    key: 'id',
                },
                comment: 'Set once the real order is created — the idempotency anchor',
            },
            razorpayPaymentId: {
                type: Sequelize.STRING(64),
                allowNull: true,
            },
            failureReason: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            createdAt: Sequelize.DATE,
            updatedAt: Sequelize.DATE,
        });
    },

    down: async (queryInterface) => {
        await queryInterface.dropTable('razorpay_order');
    },
};

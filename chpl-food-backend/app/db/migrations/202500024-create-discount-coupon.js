'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('discount_coupon', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            tenantId: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'tenant',
                    key: 'id',
                },
            },
            code: {
                type: Sequelize.STRING(50),
                allowNull: false,
                unique: true,
            },
            type: {
                type: Sequelize.ENUM('flat', 'percent'),
                allowNull: false,
            },
            value: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
            },
            maxUsage: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            minOrderAmount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true,
                comment: 'Minimum bill amount required to apply this coupon',
            },
            isPublic: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
                comment: 'If true, coupon is available to all users',
            },

            validFrom: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            validTo: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            description: {
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
        await queryInterface.dropTable('discount_coupon');
    },
};

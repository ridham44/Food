'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('expense_entry', {
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
            title: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            amount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
            },
            date: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            category: {
                type: Sequelize.ENUM('Kitchen', 'Maintenance', 'Utilities', 'Other'),
                allowNull: false,
                defaultValue: 'Other',
                comment: 'Kitchen, Maintenance, Utilities, Other',
            },
            paymentMode: {
                type: Sequelize.ENUM('Cash', 'Card', 'UPI', 'Bank Transfer', 'Other'),
                allowNull: false,
                defaultValue: 'Cash',
                comment: 'Cash, Card, UPI, Bank Transfer, Other',
            },
            remarks: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            createdBy: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'user',
                    key: 'id',
                },
            },
            createdAt: Sequelize.DATE,
        });
    },

    down: async (queryInterface) => {
        await queryInterface.dropTable('expense_entry');
    },
};

'use strict';

module.exports = (sequelize, Sequelize) => {
    const ExpenseEntry = sequelize.define(
        'ExpenseEntry',
        {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            tenantId: {
                type: Sequelize.UUID,
                allowNull: false,
                association: {
                    model: 'Tenant',
                    key: 'id',
                    belongsToAlias: 'Tenant',
                    hasManyAlias: 'ExpenseEntries',
                },
            },
            title: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            amount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
            },
            date: {
                type: Sequelize.DATEONLY,
                allowNull: false,
            },
            category: {
                type: Sequelize.ENUM('Kitchen', 'Maintenance', 'Utilities', 'Other'),
                allowNull: false,
                defaultValue: 'Other',
            },
            paymentMode: {
                type: Sequelize.ENUM('Cash', 'Card', 'UPI', 'Bank Transfer', 'Other'),
                allowNull: false,
                defaultValue: 'Cash',
            },
            remarks: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            createdBy: {
                type: Sequelize.UUID,
                allowNull: false,
                association: {
                    model: 'User',
                    key: 'id',
                    belongsToAlias: 'Creator',
                    hasManyAlias: 'CreatedExpenses',
                },
            },
            createdAt: Sequelize.DATE,
        },
        {
            tableName: 'expense_entry',
            timestamps: false,
        }
    );

    ExpenseEntry.hasTenantCondition(true);

    return ExpenseEntry;
};

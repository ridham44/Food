'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('vendor_item', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            vendorId: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'vendor',
                    key: 'id',
                },
            },
            ingredientName: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            category: {
                type: Sequelize.STRING(100),
                allowNull: true,
                comment: 'e.g., Dairy, Spices, Vegetables',
            },
            costPerUnit: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
            },
            unit: {
                type: Sequelize.STRING(50),
                allowNull: false,
                comment: 'e.g., kg, litre, packet',
            },
            status: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            createdAt: Sequelize.DATE,
            updatedAt: Sequelize.DATE,
        });
    },

    down: async (queryInterface) => {
        await queryInterface.dropTable('vendor_item');
    },
};

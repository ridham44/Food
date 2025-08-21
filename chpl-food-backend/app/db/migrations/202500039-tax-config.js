'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('tax_config', {
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
            gst: {
                type: Sequelize.DECIMAL(5, 2),
                allowNull: false,
                comment: 'GST percentage (e.g., 18.00)',
            },
            packingFee: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                comment: 'Flat packing fee (applied if isParcel = 1)',
            },
            status: {
                type: Sequelize.ENUM('0', '1'),
                allowNull: false,
                defaultValue: '1',
                comment: '1 = Active, 0 = Inactive',
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updatedAt: {
                allowNull: true,
                type: Sequelize.DATE,
            },
        });
    },

    down: async (queryInterface) => {
        await queryInterface.dropTable('tax_config');
    },
};

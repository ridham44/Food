'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('customer_address', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            customerId: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'customer',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            label: {
                type: Sequelize.STRING(20),
                allowNull: false,
                defaultValue: 'Home',
            },
            contactName: {
                type: Sequelize.STRING(50),
                allowNull: false,
            },
            contactPhone: {
                type: Sequelize.STRING(15),
                allowNull: false,
            },
            addressLine: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            countryId: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'geo_country',
                    key: 'id',
                },
            },
            stateId: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'geo_state',
                    key: 'id',
                },
            },
            cityId: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'geo_city',
                    key: 'id',
                },
            },
            pincode: {
                type: Sequelize.STRING(10),
                allowNull: true,
            },
            isDefault: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            createdAt: Sequelize.DATE,
            updatedAt: Sequelize.DATE,
        });
    },

    down: async (queryInterface) => {
        await queryInterface.dropTable('customer_address');
    },
};

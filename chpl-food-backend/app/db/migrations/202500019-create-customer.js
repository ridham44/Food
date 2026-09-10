'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('customer', {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: Sequelize.UUIDV4,
            },
            firstName: {
                type: Sequelize.STRING(20),
                allowNull: false,
            },
            lastName: {
                type: Sequelize.STRING(20),
                allowNull: false,
            },
            gender: {
                type: Sequelize.ENUM('male', 'female'),
                allowNull: false,
                defaultValue: 'male',
            },
            email: {
                type: Sequelize.STRING(50),
                allowNull: true,
            },
            phoneNo: {
                type: Sequelize.STRING(15),
                allowNull: false,
            },
            verified: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            roleId: {
                type: Sequelize.UUID,
                references: {
                    model: 'role',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
            address: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            countryCode: {
                type: Sequelize.STRING(5),
                allowNull: true,
            },
            countryId: {
                type: Sequelize.UUID,
                references: {
                    model: 'geo_country',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
            cityId: {
                type: Sequelize.UUID,
                references: {
                    model: 'geo_city',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },

            stateId: {
                type: Sequelize.UUID,
                references: {
                    model: 'geo_state',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
            birthDate: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            createdBy: {
                type: Sequelize.UUID,
                references: {
                    model: 'user',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('customer');
    },
};

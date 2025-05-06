'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('user', {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: Sequelize.UUIDV4,
            },
            storeId: {
                type: Sequelize.UUID,
                references: {
                    model: 'store',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
            tenantId: {
                type: Sequelize.UUID,
                references: {
                    model: 'tenant',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
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
            shortCode: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            firstName: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            lastName: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            gender: {
                type: Sequelize.ENUM('male', 'female'),
                allowNull: false,
                defaultValue: 'male',
            },
            countryCode: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            mobile: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            email: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            password: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            passwordShow: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            profileImage: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            address: {
                type: Sequelize.TEXT,
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
            stateId: {
                type: Sequelize.UUID,
                references: {
                    model: 'geo_state',
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
            zipCode: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            birthDate: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            anniversaryDate: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            notificationPlayerId: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            deviceTokenId: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            status: {
                type: Sequelize.ENUM('0', '1'),
                allowNull: false,
                defaultValue: '1',
                comment: '0 for Inactive, 1 for Active',
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
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            updatedBy: {
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
        await queryInterface.dropTable('user');
    },
};

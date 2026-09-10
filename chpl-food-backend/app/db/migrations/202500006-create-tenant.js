'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('tenant', {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: Sequelize.UUIDV4,
            },
            shortCode: {
                type: Sequelize.STRING(10),
                allowNull: false,
            },
            companyName: {
                type: Sequelize.STRING(50),
                allowNull: false,
            },
            contactPerson: {
                type: Sequelize.STRING(50),
                allowNull: true,
            },
            countryCode: {
                type: Sequelize.STRING(3),
                allowNull: true,
            },
            mobile: {
                type: Sequelize.STRING(15),
                allowNull: false,
            },
            phoneCountryCode: {
                type: Sequelize.STRING(3),
                allowNull: true,
            },
            phone: {
                type: Sequelize.STRING(15),
                allowNull: true,
            },
            email: {
                type: Sequelize.STRING(100),
                allowNull: false,
                unique: false,
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
                type: Sequelize.STRING(10),
                allowNull: true,
            },
            gstNumber: {
                type: Sequelize.STRING(15),
                allowNull: true,
            },
            panNumber: {
                type: Sequelize.STRING(10),
                allowNull: true,
            },
            frontImage: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            backImage: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            website: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            termAndCondition: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            returnAndExchange: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            status: {
                type: Sequelize.ENUM('0', '1', '2', '3'),
                allowNull: false,
                defaultValue: '0',
                comment: '0=Pending,1=Approved,2=InProgress,3=Rejected',
            },
            emailVerified: {
                type: Sequelize.ENUM('1', '0'),
                allowNull: false,
                defaultValue: '0',
            },
            emailVerifiedAt: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            approvedAt: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            rejectedAt: {
                type: Sequelize.DATE,
                allowNull: true,
            },
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('tenant');
    },
};

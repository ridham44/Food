'use strict';
module.exports = (sequelize, Sequelize) => {
    const Tenant = sequelize.define(
        'Tenant',
        {
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
                set(value) {
                    this.setDataValue('email', value?.toLowerCase());
                },
            },
            address: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            countryId: {
                type: Sequelize.UUID,
                allowNull: true,
                association: {
                    model: 'GeoCountry',
                    key: 'id',
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT',
                    belongsToAlias: 'GeoCountry',
                    hasManyAlias: 'Tenant',
                },
            },
            stateId: {
                type: Sequelize.UUID,
                allowNull: true,
                association: {
                    model: 'GeoState',
                    key: 'id',
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT',
                    belongsToAlias: 'GeoState',
                    hasManyAlias: 'Tenant',
                },
            },
            cityId: {
                type: Sequelize.UUID,
                allowNull: true,
                association: {
                    model: 'GeoCity',
                    key: 'id',
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT',
                    belongsToAlias: 'GeoCity',
                    hasManyAlias: 'Tenant',
                },
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
                onCreate: sequelize.literal('CURRENT_TIMESTAMP'),
            },
            createdBy: {
                type: Sequelize.UUID,
                allowNull: false,
                association: {
                    model: 'User',
                    key: 'id',
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT',
                },
            },
            updatedAt: {
                type: Sequelize.DATE,
                onUpdate: sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updatedBy: {
                type: Sequelize.UUID,
                allowNull: true,
                association: {
                    model: 'User',
                    key: 'id',
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT',
                },
            },
            approvedAt: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            approvedBy: {
                type: Sequelize.UUID,
                allowNull: true,
                association: {
                    model: 'User',
                    key: 'id',
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT',
                },
            },
            rejectedAt: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            rejectedBy: {
                type: Sequelize.UUID,
                allowNull: true,
                association: {
                    model: 'User',
                    key: 'id',
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT',
                },
            },
            rejectedReason: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
        },

        {
            tableName: 'tenant',
            customOptions: {
                createdBy: { value: true },
                updatedBy: { value: true },
            },
        }
    );

    Tenant.hasTenantCondition(false);

    return Tenant;
};

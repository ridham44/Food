'use strict';

module.exports = (sequelize, Sequelize) => {
    const CustomerAddress = sequelize.define(
        'CustomerAddress',
        {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            customerId: {
                type: Sequelize.UUID,
                allowNull: false,
                association: {
                    model: 'Customer',
                    key: 'id',
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                    belongsToAlias: 'Customer',
                    hasManyAlias: 'CustomerAddress',
                },
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
                association: {
                    model: 'GeoCountry',
                    key: 'id',
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT',
                    belongsToAlias: 'GeoCountry',
                    hasManyAlias: 'CountryAddresses',
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
                    hasManyAlias: 'StateAddresses',
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
                    hasManyAlias: 'CityAddresses',
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
        },
        {
            tableName: 'customer_address',
            timestamps: false,
        }
    );

    CustomerAddress.hasTenantCondition(false);

    return CustomerAddress;
};

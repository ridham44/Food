'use strict';
module.exports = (sequelize, Sequelize) => {
    const GeoCountry = sequelize.define(
        'GeoCountry',
        {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: Sequelize.UUIDV4,
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            countryCode: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            currencyCode: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            telephonePrefix: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            flag: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            status: {
                type: Sequelize.ENUM('0', '1'),
                allowNull: false,
                defaultValue: '1',
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                onCreate: sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updatedAt: {
                type: Sequelize.DATE,
                onUpdate: sequelize.literal('CURRENT_TIMESTAMP'),
            },
        },
        {
            tableName: 'geo_country',
        }
    );

    GeoCountry.hasTenantCondition(false);

    return GeoCountry;
};

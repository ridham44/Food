'use strict';
module.exports = (sequelize, Sequelize) => {
    const GeoCity = sequelize.define(
        'GeoCity',
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
            cityCode: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            countryId: {
                type: Sequelize.UUID,
                allowNull: false,
                association: {
                    model: 'GeoCountry',
                    key: 'id',
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT',
                    belongsToAlias: 'GeoCountry',
                    hasManyAlias: 'GeoCity',
                },
            },
            stateId: {
                type: Sequelize.UUID,
                allowNull: false,
                association: {
                    model: 'GeoState',
                    key: 'id',
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT',
                    belongsToAlias: 'GeoState',
                    hasManyAlias: 'GeoCity',
                },
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
            tableName: 'geo_city',
        }
    );

    GeoCity.hasTenantCondition(false);

    return GeoCity;
};

'use strict';
module.exports = (sequelize, Sequelize) => {
    const Customer = sequelize.define(
        'Customer',
        {
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
            fullName: {
                type: Sequelize.VIRTUAL,
                get() {
                    return `${this.firstName || ''} ${this.lastName || ''}`.trim();
                },
            },
            gender: {
                type: Sequelize.ENUM('male', 'female'),
                allowNull: false,
                defaultValue: 'male',
            },
            email: {
                type: Sequelize.STRING(50),
                allowNull: true,
                set(value) {
                    this.setDataValue('email', value?.toLowerCase());
                },
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
                allowNull: false,
                association: {
                    model: 'Role',
                    key: 'id',
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT',
                    belongsToAlias: 'CustomerRole',
                    hasManyAlias: 'RoleCustomers',
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
                    hasManyAlias: 'CountryCustomers',
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
                    belongsToAlias: 'CustomerCity',
                    hasManyAlias: 'CityCustomers',
                },
            },
            countryCode: {
                type: Sequelize.STRING(5),
                allowNull: true,
            },
            stateId: {
                type: Sequelize.UUID,
                allowNull: true,
                association: {
                    model: 'GeoState',
                    key: 'id',
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT',
                    belongsToAlias: 'CustomerState',
                    hasManyAlias: 'StateCustomers',
                },
            },
            birthDate: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            createdBy: {
                type: Sequelize.UUID,
                allowNull: true,
                association: {
                    model: 'User',
                    key: 'id',
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT',
                    belongsToAlias: 'CustomerCreator',
                    hasManyAlias: 'CustomersCreated',
                },
            },
        },
        {
            tableName: 'customer',
            timestamps: false,
            underscored: false,
            customOptions: {
                createdBy: { value: true },
            },
            defaultScope: {
                attributes: {
                    exclude: [],
                },
            },
        }
    );

    Customer.hasTenantCondition?.(false);

    return Customer;
};

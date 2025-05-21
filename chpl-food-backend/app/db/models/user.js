'use strict';
const bcrypt = require('bcryptjs');

module.exports = (sequelize, Sequelize) => {
    const User = sequelize.define(
        'User',
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
                    let fullName = `${this.firstName ? this.firstName : ''} ${this.lastName ? this.lastName : ''}`;
                    return fullName?.trim();
                },
            },

            tenantId: {
                type: Sequelize.UUID,
                allowNull: false,
                association: {
                    model: 'Tenant',
                    key: 'id',
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT',
                    belongsToAlias: 'Tenant',
                    hasManyAlias: 'User',
                },
            },
            roleId: {
                type: Sequelize.UUID,
                allowNull: false,
                association: {
                    model: 'Role',
                    key: 'id',
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT',
                    belongsToAlias: 'Role',
                    hasManyAlias: 'User',
                },
            },
            countryCode: {
                type: Sequelize.STRING(3),
                allowNull: true,
            },
            mobile: {
                type: Sequelize.STRING(15),
                allowNull: false,
            },
            email: {
                type: Sequelize.STRING(50),
                allowNull: false,
                set(value) {
                    this.setDataValue('email', value?.toLowerCase());
                },
            },
            shortCode: {
                type: Sequelize.STRING(5),
                allowNull: false,
            },
            profileImage: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            password: {
                type: Sequelize.STRING(100),
                allowNull: false,
                set(value) {
                    this.setDataValue('password', bcrypt.hashSync(value, 10));
                },
            },
            passwordShow: {
                type: Sequelize.STRING(100),
                allowNull: false,
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
                    hasManyAlias: 'User',
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
                    hasManyAlias: 'User',
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
                    hasManyAlias: 'User',
                },
            },
            zipCode: {
                type: Sequelize.STRING(10),
                allowNull: true,
            },
            gender: {
                type: Sequelize.ENUM('male', 'female'),
                allowNull: false,
                defaultValue: 'male',
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
                type: Sequelize.ENUM('1', '0'),
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
            tableName: 'user',
            underscored: false,
            customOptions: {
                createdBy: { value: true },
                updatedBy: { value: true },
            },
            defaultScope: {
                attributes: {
                    exclude: ['password'],
                },
            },
            scopes: {
                withPassword: {
                    attributes: { include: ['password'] },
                },
                withoutTenant: {
                    where: {},
                },
            },
        }
    );
    // User.hasTenantCondition();

    return User;
};

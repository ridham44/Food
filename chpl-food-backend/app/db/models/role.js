'use strict';
module.exports = (sequelize, Sequelize) => {
    const Role = sequelize.define(
        'Role',
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
            type: {
                type: Sequelize.ENUM('1', '2', '3'),
                allowNull: false,
                defaultValue: '3',
                comment: '1 for AdminUser, 2 for Tenant, 3 for Store',
            },
            isAdmin: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
                allowNull: false,
            },
            remark: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            status: {
                type: Sequelize.ENUM('0', '1'),
                allowNull: false,
                defaultValue: '1',
                comment: '0 for Inactive, 1 for Active',
            },
            tenantId: {
                type: Sequelize.UUID,
                allowNull: true,
                association: {
                    model: 'Tenant',
                    key: 'id',
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT',
                    belongsToAlias: 'Tenant',
                    hasManyAlias: 'Role',
                },
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updatedAt: {
                allowNull: true,
                type: Sequelize.DATE,
            },
        },
        {
            tableName: 'role',
            customOptions: {
                createdBy: { value: true },
                updatedBy: { value: true },
            },
        }
    );

    Role.hasTenantCondition();

    return Role;
};

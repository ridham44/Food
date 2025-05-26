'use strict';
module.exports = (sequelize, Sequelize) => {
    const LogLogin = sequelize.define(
        'LogLogin',
        {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: Sequelize.UUIDV4,
            },
            tenantId: {
                type: Sequelize.UUID,
                association: {
                    model: 'Tenant',
                    key: 'id',
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT',
                    belongsToAlias: 'Tenant',
                    hasManyAlias: 'LogLogin',
                },
                allowNull: false,
            },
            logoutAt: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            sessionDuration: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            ipAddress: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            browserDetail: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            isLogin: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            deviceType: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
            },
            createdBy: {
                type: Sequelize.UUID,
                allowNull: false,
                association: {
                    model: 'User',
                    key: 'id',
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT',
                    belongsToAlias: 'User',
                    hasManyAlias: 'LogLogin',
                },
            },
        },
        {
            tableName: 'log_login',
            underscored: false,
            timestamps: false,
        }
    );

    LogLogin.hasTenantCondition();

    return LogLogin;
};

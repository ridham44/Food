'use strict';
module.exports = (sequelize, Sequelize) => {
    const ActivityLog = sequelize.define(
        'activityLog',
        {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
            },
            tenantId: {
                type: Sequelize.UUID,
                allowNull: true,
            },
            userId: {
                type: Sequelize.UUID,
                allowNull: true,
                association: {
                    model: 'User',
                    key: 'id',
                    belongsToAlias: 'User',
                    hasManyAlias: 'ActivityLogs',
                    onDelete: 'RESTRICT',
                    onUpdate: 'CASCADE',
                },
            },
            customerId: {
                type: Sequelize.UUID,
                allowNull: true,
                association: {
                    model: 'Customer',
                    key: 'id',
                    belongsToAlias: 'Customer',
                    hasManyAlias: 'ActivityLogs',
                },
            },
            module: {
                type: Sequelize.STRING(100),
                allowNull: false,
            },
            action: {
                type: Sequelize.ENUM('create', 'update', 'delete'),
                allowNull: false,
                comment: 'Action type: create, update, delete',
            },
            recordId: {
                type: Sequelize.UUID,
                allowNull: false,
            },
            value: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            createdAt: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW,
            },
        },
        {
            tableName: 'activityLog',
            underscored: false,
            timestamps: false,
        }
    );

    ActivityLog.hasTenantCondition(false);

    return ActivityLog;
};

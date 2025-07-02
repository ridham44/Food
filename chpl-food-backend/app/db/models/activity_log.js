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
            user_id: {
                type: Sequelize.UUID,
                allowNull: false,
                association: {
                    model: 'User',
                    key: 'id',
                    belongsToAlias: 'User',
                    hasManyAlias: 'ActivityLogs',
                    onDelete: 'RESTRICT',
                    onUpdate: 'CASCADE',
                },
            },
            tenant_id: {
                type: Sequelize.UUID,
                allowNull: false,
                association: {
                    model: 'Tenant',
                    key: 'id',
                    belongsToAlias: 'Tenant',
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
            record_id: {
                type: Sequelize.UUID,
                allowNull: false,
            },
            value: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            created_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW,
            },
        },
        {
            tableName: 'activityLog',
            underscored: true,
            timestamps: false,
        }
    );

    ActivityLog.hasTenantCondition(false);

    return ActivityLog;
};

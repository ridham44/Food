'use strict';
module.exports = (sequelize, Sequelize) => {
    const Setting = sequelize.define(
        'Setting',
        {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: Sequelize.UUIDV4,
            },
            title: {
                type: Sequelize.STRING(200),
                allowNull: false,
            },
            key: {
                type: Sequelize.STRING(200),
                unique: true,
                allowNull: false,
            },
            value: {
                type: Sequelize.STRING(200),
                allowNull: true,
            },
            remark: {
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
                    belongsToAlias: 'CreatedByUser',
                    hasManyAlias: 'CreatedSettings',
                },
            },
            updatedBy: {
                type: Sequelize.UUID,
                allowNull: true,
                association: {
                    model: 'User',
                    key: 'id',
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT',
                    belongsToAlias: 'UpdatedByUser',
                    hasManyAlias: 'UpdatedSettings',
                },
            },

            updatedAt: {
                type: Sequelize.DATE,
                defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
                allowNull: true,
            },
        },

        {
            tableName: 'setting',
        }
    );

    Setting.hasTenantCondition(false);

    return Setting;
};

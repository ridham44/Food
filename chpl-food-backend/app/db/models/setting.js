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
            updatedAt: {
                type: Sequelize.DATE,
                defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
                allowNull: true,
            },
        },

        {
            tableName: 'setting',
            customOptions: {
                createdBy: { value: true },
                updatedBy: { value: true },
            },
        }
    );

    Setting.hasTenantCondition(true);

    return Setting;
};

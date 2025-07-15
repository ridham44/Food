'use strict';

module.exports = (sequelize, Sequelize) => {
    const ComboGroupItem = sequelize.define(
        'ComboGroupItem',
        {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                defaultValue: Sequelize.UUIDV4,
                allowNull: false,
            },
            comboGroupId: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'combo_group',
                    key: 'id',
                },
            },
            menuId: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'menu',
                    key: 'id',
                },
            },
            quantity: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            type: {
                type: Sequelize.ENUM('buy', 'get'),
                allowNull: false,
                Comment: 'Type of combo group item, either "buy" or "get"',
            },
        },
        {
            tableName: 'combo_group_item',
            timestamps: false,
            underscored: false,
        }
    );

    ComboGroupItem.hasTenantCondition?.(false);
    return ComboGroupItem;
};

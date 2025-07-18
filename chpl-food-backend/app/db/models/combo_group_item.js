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
                association: {
                    model: 'ComboGroup',
                    key: 'id',
                    belongsToAlias: 'ComboGroup',
                    hasManyAlias: 'ComboGroupItems',
                },
            },
            menuId: {
                type: Sequelize.UUID,
                allowNull: false,
                association: {
                    model: 'Menu',
                    key: 'id',
                    belongsToAlias: 'Menu',
                    hasManyAlias: 'ComboGroupItems',
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

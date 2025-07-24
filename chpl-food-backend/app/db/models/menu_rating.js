'use strict';
module.exports = (sequelize, Sequelize) => {
    const MenuRating = sequelize.define(
        'MenuRating',
        {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: Sequelize.UUIDV4,
            },
            orderId: {
                type: Sequelize.UUID,
                allowNull: false,
                association: {
                    model: 'OrderList',
                    key: 'id',
                    belongsToAlias: 'OrderList',
                    hasManyAlias: 'MenuRating',
                },
            },
            menuId: {
                type: Sequelize.UUID,
                allowNull: true,
                association: {
                    model: 'Menu',
                    key: 'id',
                    belongsToAlias: 'Menu',
                    hasManyAlias: 'MenuRating',
                },
            },
            comboItemId: {
                type: Sequelize.UUID,
                allowNull: true,
                association: {
                    model: 'ComboGroup',
                    key: 'id',
                    belongsToAlias: 'ComboGroup',
                    hasManyAlias: 'MenuRating',
                },
                comment: 'If part of a combo, this is the actual item ID',
            },
            customerId: {
                type: Sequelize.UUID,
                allowNull: false,
                association: {
                    model: 'Customer',
                    key: 'id',
                    belongsToAlias: 'Customer',
                    hasManyAlias: 'MenuRating',
                },
            },
            rating: {
                type: Sequelize.INTEGER,
                allowNull: false,
                validate: {
                    min: 1,
                    max: 5,
                },
            },
            review: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
            },
        },
        {
            tableName: 'menu_rating',
            timestamps: false,
        }
    );

    MenuRating.hasTenantCondition(false);

    return MenuRating;
};

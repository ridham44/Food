'use strict';

module.exports = (sequelize, Sequelize) => {
    const VendorItem = sequelize.define(
        'VendorItem',
        {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            vendorId: {
                type: Sequelize.UUID,
                allowNull: false,
                association: {
                    model: 'Vendor',
                    key: 'id',
                    belongsToAlias: 'Vendor',
                    hasManyAlias: 'VendorItems',
                },
            },
            ingredientName: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            category: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            costPerUnit: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
            },
            unit: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            status: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            createdAt: Sequelize.DATE,
            updatedAt: Sequelize.DATE,
        },
        {
            tableName: 'vendor_item',
            timestamps: false,
        }
    );

    return VendorItem;
};

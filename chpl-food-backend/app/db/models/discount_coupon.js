'use strict';

module.exports = (sequelize, DataTypes) => {
    const DiscountCoupon = sequelize.define(
        'DiscountCoupon',
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            tenantId: {
                type: DataTypes.UUID,
                allowNull: false,
                association: {
                    model: 'Tenant',
                    key: 'id',
                    belongsToAlias: 'Tenant',
                    hasManyAlias: 'DiscountCoupon',
                },
            },
            code: {
                type: DataTypes.STRING(50),
                allowNull: false,
                unique: true,
            },
            type: {
                type: DataTypes.ENUM('flat', 'percent'),
                allowNull: false,
            },
            value: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
            },
            maxUsage: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            minOrderAmount: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true,
                comment: 'Minimum bill amount required to apply this coupon',
            },
            isPublic: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
                comment: 'If true, coupon is available to all users',
            },

            validFrom: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            validTo: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            createdAt: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            tableName: 'discount_coupon',
            timestamps: false,
        }
    );

    DiscountCoupon.hasTenantCondition(false);
    return DiscountCoupon;
};

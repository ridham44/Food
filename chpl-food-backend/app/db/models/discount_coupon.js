'use strict';

module.exports = (sequelize, Sequelize) => {
    const DiscountCoupon = sequelize.define(
        'DiscountCoupon',
        {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            tenantId: {
                type: Sequelize.UUID,
                allowNull: false,
                association: {
                    model: 'Tenant',
                    key: 'id',
                    belongsToAlias: 'Tenant',
                    hasManyAlias: 'DiscountCoupon',
                },
            },
            code: {
                type: Sequelize.STRING(50),
                allowNull: false,
                unique: true,
            },
            type: {
                type: Sequelize.ENUM('flat', 'percent'),
                allowNull: false,
            },
            value: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
            },
            maxUsage: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            minOrderAmount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true,
                comment: 'Minimum bill amount required to apply this coupon',
            },
            isPublic: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
                comment: 'If true, coupon is available to all users',
            },

            validFrom: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            validTo: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            createdAt: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW,
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

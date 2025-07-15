'use strict';

module.exports = (sequelize, DataTypes) => {
    const DiscountCouponUser = sequelize.define(
        'DiscountCouponUser',
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            couponId: {
                type: DataTypes.UUID,
                allowNull: false,
                association: {
                    model: 'DiscountCoupon',
                    key: 'id',
                    belongsToAlias: 'DiscountCoupon',
                    hasManyAlias: 'DiscountCouponUser',
                },
            },
            customerId: {
                type: DataTypes.UUID,
                allowNull: false,
                association: {
                    model: 'User',
                    key: 'id',
                    belongsToAlias: 'User',
                    hasManyAlias: 'DiscountCouponUser',
                },
            },
            usedCount: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
                allowNull: false,
            },
        },
        {
            tableName: 'discount_coupon_user',
            timestamps: false,
        }
    );

    DiscountCouponUser.hasTenantCondition(false);
    return DiscountCouponUser;
};
  

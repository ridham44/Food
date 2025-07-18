'use strict';

module.exports = (sequelize, Sequelize) => {
    const DiscountCouponUser = sequelize.define(
        'DiscountCouponUser',
        {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            couponId: {
                type: Sequelize.UUID,
                allowNull: false,
                association: {
                    model: 'DiscountCoupon',
                    key: 'id',
                    belongsToAlias: 'DiscountCoupon',
                    hasManyAlias: 'DiscountCouponUser',
                },
            },
            customerId: {
                type: Sequelize.UUID,
                allowNull: false,
                association: {
                    model: 'Customer',
                    key: 'id',
                    belongsToAlias: 'Customer',
                    hasManyAlias: 'DiscountCouponCustomer',
                },
            },
            usedCount: {
                type: Sequelize.INTEGER,
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
  

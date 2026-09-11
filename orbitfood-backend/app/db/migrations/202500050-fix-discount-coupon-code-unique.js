'use strict';

module.exports = {
    up: async (queryInterface) => {
        await queryInterface.removeIndex('discount_coupon', 'code');
        await queryInterface.addIndex('discount_coupon', ['tenantId', 'code'], {
            unique: true,
            name: 'discount_coupon_tenant_id_code_unique',
        });
    },

    down: async (queryInterface) => {
        await queryInterface.removeIndex('discount_coupon', 'discount_coupon_tenant_id_code_unique');
        await queryInterface.addIndex('discount_coupon', ['code'], {
            unique: true,
            name: 'code',
        });
    },
};

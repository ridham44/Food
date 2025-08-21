'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await Promise.all([
            queryInterface.addColumn('order_bill', 'packingFee', {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0.0,
                comment: 'Packing fee if parcel is selected',
            }),
            queryInterface.addColumn('order_bill', 'gstPercent', {
                type: Sequelize.DECIMAL(5, 2),
                allowNull: false,
                defaultValue: 0.0,
                comment: 'GST % from tax_config',
            }),
        ]);
    },

    down: async (queryInterface) => {
        await Promise.all([
            queryInterface.removeColumn('order_bill', 'packingFee'),
            queryInterface.removeColumn('order_bill', 'gstPercent'),
        ]);
    },
};

'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('order_list', 'deliveryAddressId', {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
                model: 'customer_address',
                key: 'id',
            },
            onDelete: 'SET NULL',
        });
        await queryInterface.addColumn('order_list', 'deliveryAddressSnapshot', {
            type: Sequelize.TEXT,
            allowNull: true,
            comment: 'JSON snapshot frozen at order time — authoritative, independent of later address-book edits',
        });
    },

    down: async (queryInterface) => {
        await queryInterface.removeColumn('order_list', 'deliveryAddressId');
        await queryInterface.removeColumn('order_list', 'deliveryAddressSnapshot');
    },
};

'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        return Promise.all([
            queryInterface.addColumn('order_list', 'cancelReason', {
                type: Sequelize.STRING(255),
                allowNull: true,
            }),
            queryInterface.addColumn('order_list', 'cancelledBy', {
                type: Sequelize.ENUM('0', '1'),
                allowNull: true,
                comment: '0 = customer, 1 = tenant',
            }),
            queryInterface.addColumn('order_list', 'updatedAt', {
                type: Sequelize.DATE,
                allowNull: true,
            }),
        ]);
    },

    async down(queryInterface, Sequelize) {
        return Promise.all([
            queryInterface.removeColumn('order_list', 'cancelReason'),
            queryInterface.removeColumn('order_list', 'cancelledBy'),
            queryInterface.removeColumn('order_list', 'updatedAt'),
        ]);
    },
};

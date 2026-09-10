'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        return Promise.all([
            queryInterface.addColumn('order_item', 'specialInstruction', {
                type: Sequelize.STRING(255),
                allowNull: true,
                comment: 'e.g., no onions, less spicy',
            }),
        ]);
    },

    async down(queryInterface, Sequelize) {
        return Promise.all([queryInterface.removeColumn('order_item', 'specialInstruction')]);
    },
};

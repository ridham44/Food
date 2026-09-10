'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        return Promise.all([
            queryInterface.addColumn('order_item', 'comboId', {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'combo_group',
                    key: 'id',
                },
            }),
        ]);
    },

    async down(queryInterface, Sequelize) {
        return Promise.all([
            queryInterface.removeColumn('order_item', 'comboId'),
        ]);
    },
};

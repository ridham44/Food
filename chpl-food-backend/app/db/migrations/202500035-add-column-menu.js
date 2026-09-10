'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        return Promise.all([
            queryInterface.addColumn('menu', 'isAvailable', {
                type: Sequelize.ENUM('0', '1'),
                allowNull: false,
                defaultValue: '1',
                comment: '1 = available, 0 = unavailable',
            }),
        ]);
    },

    async down(queryInterface, Sequelize) {
        return Promise.all([queryInterface.removeColumn('menu', 'isAvailable')]);
    },
};

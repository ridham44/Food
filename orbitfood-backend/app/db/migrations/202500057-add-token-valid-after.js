'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('user', 'tokenValidAfter', {
            type: Sequelize.DATE,
            allowNull: true,
        });
        await queryInterface.addColumn('customer', 'tokenValidAfter', {
            type: Sequelize.DATE,
            allowNull: true,
        });
    },

    down: async (queryInterface) => {
        await queryInterface.removeColumn('user', 'tokenValidAfter');
        await queryInterface.removeColumn('customer', 'tokenValidAfter');
    },
};

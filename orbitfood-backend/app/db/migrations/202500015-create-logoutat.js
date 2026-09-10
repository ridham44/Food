'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.changeColumn('log_login', 'logoutAt', {
            type: Sequelize.DATE,
            allowNull: true,
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.changeColumn('log_login', 'logoutAt', {
            type: Sequelize.DATE,
            allowNull: false,
        });
    },
};

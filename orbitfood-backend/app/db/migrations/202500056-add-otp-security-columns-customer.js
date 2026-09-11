'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('customer', 'otpExpiresAt', {
            type: Sequelize.DATE,
            allowNull: true,
        });
        await queryInterface.addColumn('customer', 'otpAttempts', {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
        });
        await queryInterface.addColumn('customer', 'otpLastSentAt', {
            type: Sequelize.DATE,
            allowNull: true,
        });
    },

    down: async (queryInterface) => {
        await queryInterface.removeColumn('customer', 'otpExpiresAt');
        await queryInterface.removeColumn('customer', 'otpAttempts');
        await queryInterface.removeColumn('customer', 'otpLastSentAt');
    },
};

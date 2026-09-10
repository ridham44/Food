'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('order_bill', 'pointsUsed', {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Number of points used for this bill (1 point = ₹1)',
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('order_bill', 'pointsUsed');
    },
};

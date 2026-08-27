'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('activityLog', 'tenantId');


        await queryInterface.addColumn('activityLog', 'customerId', {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
                model: 'customer',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('activityLog', 'customerId');

        await queryInterface.addColumn('activityLog', 'tenantId', {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
                model: 'tenant',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        });
    }
};

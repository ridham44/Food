'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        return Promise.all([
            queryInterface.addColumn('role', 'tenantId', {
                type: Sequelize.UUID,
                references: {
                    model: 'tenant',
                    key: 'id',
                },
                allowNull: true,
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            }),
            queryInterface.addColumn('role', 'storeId', {
                type: Sequelize.UUID,
                references: {
                    model: 'store',
                    key: 'id',
                },
                allowNull: true,
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            }),
            queryInterface.addColumn('role', 'createdBy', {
                type: Sequelize.UUID,
                references: {
                    model: 'user',
                    key: 'id',
                },
                allowNull: true,
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            }),
            queryInterface.addColumn('role', 'updatedBy', {
                type: Sequelize.UUID,
                references: {
                    model: 'user',
                    key: 'id',
                },
                allowNull: true,
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            }),
        ]);
    },

    async down(queryInterface, Sequelize) {
        return Promise.all([
            queryInterface.removeColumn('role', 'createdBy'),
            queryInterface.removeColumn('role', 'updatedBy'),
            queryInterface.removeColumn('role', 'tenantId'),
            queryInterface.removeColumn('role', 'storeId'),


        ]);
    },
};

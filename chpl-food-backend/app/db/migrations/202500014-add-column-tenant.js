'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        return Promise.all([
            queryInterface.addColumn('tenant', 'createdBy', {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'user',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            }),
            queryInterface.addColumn('tenant', 'updatedBy', {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'user',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            }),
            queryInterface.addColumn('tenant', 'approvedBy', {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'user',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            }),
            queryInterface.addColumn('tenant', 'rejectedBy', {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'user',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            }),
            queryInterface.addColumn('tenant', 'rejectedReason', {
                type: Sequelize.TEXT,
                allowNull: true,
            }),
        ]);
    },

    async down(queryInterface, Sequelize) {
        return Promise.all([
            queryInterface.removeColumn('tenant', 'createdBy'),
            queryInterface.removeColumn('tenant', 'updatedBy'),
            queryInterface.removeColumn('tenant', 'approvedBy'),
            queryInterface.removeColumn('tenant', 'rejectedBy'),
            queryInterface.removeColumn('tenant', 'rejectedReason'),
        ]);
    },
};

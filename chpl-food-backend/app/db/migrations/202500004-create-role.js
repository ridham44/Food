'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('role', {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: Sequelize.UUIDV4,
            },
            name: {
                type: Sequelize.STRING(50),
                allowNull: false,
            },
            type: {
                type: Sequelize.ENUM('1', '2', '3'),
                allowNull: false,
                defaultValue: '3',
                comment: '1 for AdminUser, 2 for Tenant, 3 for customer',
            },
            isAdmin: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
                allowNull: false,
            },
            remark: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            status: {
                type: Sequelize.ENUM('0', '1'),
                allowNull: false,
                defaultValue: '1',
                comment: '0 for Inactive, 1 for Active',
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updatedAt: {
                allowNull: true,
                type: Sequelize.DATE,
            },
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('role');
    },
};

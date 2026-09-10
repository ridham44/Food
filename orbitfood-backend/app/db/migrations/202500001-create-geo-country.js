'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('geo_country', {
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
            countryCode: {
                type: Sequelize.STRING(10),
                allowNull: false,
            },
            currencyCode: {
                type: Sequelize.STRING(6),
                allowNull: false,
            },
            telephonePrefix: {
                type: Sequelize.STRING(5),
                allowNull: false,
            },
            flag: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            description: {
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
        await queryInterface.dropTable('geo_country');
    },
};

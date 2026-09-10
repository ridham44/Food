'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('tenant', 'isOpen', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
    await queryInterface.addColumn('tenant', 'openingTime', {
      type: Sequelize.STRING(5),
      allowNull: true,
      comment: 'HH:mm, 24h',
    });
    await queryInterface.addColumn('tenant', 'closingTime', {
      type: Sequelize.STRING(5),
      allowNull: true,
      comment: 'HH:mm, 24h',
    });
    await queryInterface.addColumn('tenant', 'acceptOrders', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
    await queryInterface.addColumn('tenant', 'autoAcceptOrders', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn('tenant', 'preparationTimeMinutes', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 20,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('tenant', 'isOpen');
    await queryInterface.removeColumn('tenant', 'openingTime');
    await queryInterface.removeColumn('tenant', 'closingTime');
    await queryInterface.removeColumn('tenant', 'acceptOrders');
    await queryInterface.removeColumn('tenant', 'autoAcceptOrders');
    await queryInterface.removeColumn('tenant', 'preparationTimeMinutes');
  },
};

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('order_list', 'kitchenStatus', {
      type: Sequelize.ENUM('new', 'preparing', 'ready', 'completed'),
      allowNull: false,
      defaultValue: 'new',
      comment: 'Kitchen prep stage, only meaningful once status=2 (Approved)',
    });
    await queryInterface.addColumn('order_list', 'orderType', {
      type: Sequelize.ENUM('dine_in', 'takeaway', 'delivery'),
      allowNull: false,
      defaultValue: 'dine_in',
    });
    await queryInterface.addColumn('order_list', 'tableNumber', {
      type: Sequelize.STRING(20),
      allowNull: true,
      comment: 'Only relevant for dine_in orders',
    });

    // Backfill orderType from the existing isParcel flag for pre-existing rows.
    await queryInterface.sequelize.query(
      "UPDATE order_list SET orderType = 'takeaway' WHERE isParcel = '1'"
    );
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('order_list', 'kitchenStatus');
    await queryInterface.removeColumn('order_list', 'orderType');
    await queryInterface.removeColumn('order_list', 'tableNumber');
  },
};

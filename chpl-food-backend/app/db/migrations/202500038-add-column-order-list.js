'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('order_list', 'isParcel', {
      type: Sequelize.ENUM('0', '1'),
      allowNull: false,
      defaultValue: '0',
      comment: '1 = Parcel selected, 0 = No parcel',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('order_list', 'isParcel');
  }
};

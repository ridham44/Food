'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('combo_group_item', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      comboGroupId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'combo_group',
          key: 'id',
        },
      },
      menuId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'menu',
          key: 'id',
        },
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM('buy', 'get'),
        allowNull: false,
        Comment: 'Type of combo group item, either "buy" or "get"',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('combo_group_item');
  },
};

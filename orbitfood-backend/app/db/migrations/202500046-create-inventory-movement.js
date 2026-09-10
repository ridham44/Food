'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('inventory_movement', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      tenantId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tenant',
          key: 'id',
        },
      },
      inventoryItemId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'inventory_item',
          key: 'id',
        },
      },
      type: {
        type: Sequelize.ENUM('restock', 'usage', 'adjustment'),
        allowNull: false,
      },
      quantity: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Signed delta applied to currentStock',
      },
      note: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      createdAt: Sequelize.DATE,
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('inventory_movement');
  },
};

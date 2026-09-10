'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('inventory_item', {
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
      ingredientName: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'e.g., Dairy, Spices, Vegetables',
      },
      unit: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'e.g., kg, litre, packet',
      },
      currentStock: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      minimumLevel: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      updatedBy: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('inventory_item');
  },
};

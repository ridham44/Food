'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('restaurant_table', {
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
      tableNumber: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      capacity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 2,
      },
      section: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'e.g. Indoor, Patio, Rooftop',
      },
      status: {
        type: Sequelize.ENUM('available', 'occupied', 'reserved', 'cleaning'),
        allowNull: false,
        defaultValue: 'available',
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
    await queryInterface.dropTable('restaurant_table');
  },
};

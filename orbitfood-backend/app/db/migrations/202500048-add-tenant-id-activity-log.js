'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('activityLog', 'tenantId', {
      type: Sequelize.UUID,
      allowNull: true,
    });

    // Best-effort backfill: an entry logged by a tenant User can be
    // attributed to that user's tenant. Entries logged by a Customer have
    // no single owning tenant (a customer can order from many restaurants)
    // and are left with tenantId = NULL, which the tenant-scoped activity
    // log list endpoint excludes.
    await queryInterface.sequelize.query(`
      UPDATE activityLog al
      INNER JOIN user u ON u.id = al.userId
      SET al.tenantId = u.tenantId
      WHERE al.userId IS NOT NULL
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('activityLog', 'tenantId');
  },
};

'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            'role',
            [
                {
                    id: '6cff3d9f-02d8-11ef-8c8d-74563c332521',
                    name: 'Main Admin',
                    type: '1',
                    isAdmin: '1',
                    remark: 'Main Admin',
                    status: '1',
                    createdAt: '2025-02-01 09:49:44',
                    updatedAt: '2025-02-01 09:49:44',
                },
            ],
            {}
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('role', null, {});
    },
};

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

                {
                    id: '6cff3da0-02d8-11ef-8c8d-74563c332522',
                    tenantId:"df5815a9-3c4a-11f0-991c-c475ab7293c6",
                    name: 'Tenant',
                    type: '2',
                    isAdmin: '0',
                    remark: 'Main Tenant',
                    status: '1',
                    createdAt: '2025-05-12 09:49:44',
                    updatedAt: '2025-05-12 09:49:44',
                },

                {
                    id: '6cff3da0-02d8-11ef-8c8d-74563c33253',
                    name: 'User',
                    type: '3',
                    isAdmin: '0',
                    remark: 'Main User',
                    status: '1',
                    createdAt: '2025-05-12 09:49:44',
                    updatedAt: '2025-05-12 09:49:44',
                },
            ],

            {}
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('role', null, {});
    },
};

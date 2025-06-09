'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            'user',
            [
                {
                    id: '5f5e3582-4108-11f0-96fd-c475ab7293c6',
                    tenantId: '07c97d5c-4108-11f0-96fd-c475ab7293c6',
                    roleId: '6cff3d9f-02d8-11ef-8c8d-74563c332521',
                    shortCode: 'Main1',
                    firstName: 'John',
                    lastName: 'Doe',
                    gender: 'male',
                    countryCode: 'IND',
                    mobile: '9876543210',
                    email: 'john@example.com',
                    password: '$2a$10$1DxLrwB.2PsEd2QS1jlgA.20N3Rmda58m4awKycqmaabujhoctVyq', // hashed "admin@123"
                    passwordShow: 'admin@123',
                    profileImage: null,
                    address: '5th Floor CHPL, WTT',
                    countryId: null,
                    stateId: null,
                    cityId: null,
                    zipCode: '380007',
                    birthDate: new Date('1990-01-01T00:00:00'),
                    anniversaryDate: new Date('2025-05-06T15:26:22'),
                    notificationPlayerId: null,
                    deviceTokenId: null,
                    status: '1',
                    createdAt: new Date('2025-06-04T07:52:55'),
                    createdBy: null,
                    updatedAt: null,
                    updatedBy: null,
                },
            ],
            {}
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete(
            'user',
            {}
        );
    },
};

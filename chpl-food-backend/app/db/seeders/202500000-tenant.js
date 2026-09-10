'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            'tenant',
            [
                {
                    id: '07c97d5c-4108-11f0-96fd-c475ab7293c6',
                    shortCode: 'Main1',
                    companyName: 'chpl',
                    contactPerson: 'John Doe',
                    countryCode: 'IND',
                    mobile: '9876543210',
                    phoneCountryCode: '+91',
                    phone: '74858585829',
                    email: 'john@example.com',
                    address: '5th Floor CHPL, WTT',
                    countryId: null,
                    stateId: null,
                    cityId: null,
                    zipCode: '380007',
                    gstNumber: '123456789012345',
                    panNumber: '1234567890',
                    frontImage: null,
                    backImage: null,
                    website: 'www.chpl.org',
                    termAndCondition: null,
                    returnAndExchange: null,
                    status: "1",
                    emailVerified: 1,
                    emailVerifiedAt: new Date('2025-05-20 15:57:42'),
                    createdAt: new Date('2025-05-20 15:57:42'),
                    updatedAt: new Date('2025-06-04 07:50:03'),
                    approvedAt: new Date('2025-06-04 11:20:03'),
                    rejectedAt: null,
                    createdBy: null,
                    updatedBy: null,
                    approvedBy: null,
                    rejectedBy: null,
                    rejectedReason: null,
                },
            ],
            {}
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete(
            'tenant',
            {}
        );
    },
};

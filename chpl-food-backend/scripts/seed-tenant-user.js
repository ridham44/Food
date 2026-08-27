// One-off: create a demo user under the seeded "Tenant" role (type '2') so
// the tenant dashboard can actually be logged into and exercised. Not wired
// into the migration/seeder pipeline — just a manual dev convenience script.
require('dotenv').config();
const db = require('../app/db/models');

async function run() {
    const tenantId = '07c97d5c-4108-11f0-96fd-c475ab7293c6';
    const tenantRoleId = '6cff3da0-02d8-11ef-8c8d-74563c332522';

    const existing = await db.User.findOne({ where: { email: 'manager@chpl.test' }, disableTenantCheck: true });
    if (existing) {
        console.log('Demo tenant user already exists:', existing.email);
        process.exit(0);
    }

    const user = await db.User.create({
        tenantId,
        roleId: tenantRoleId,
        shortCode: 'MGR01',
        firstName: 'Priya',
        lastName: 'Shah',
        gender: 'female',
        countryCode: 'IND',
        mobile: '9998887777',
        email: 'manager@chpl.test',
        password: 'manager@123',
        passwordShow: 'manager@123',
        address: '5th Floor CHPL, WTT',
        birthDate: new Date('1992-01-01T00:00:00'),
        status: '1',
    });

    console.log('Created demo tenant user:', user.email, user.id);
    process.exit(0);
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});

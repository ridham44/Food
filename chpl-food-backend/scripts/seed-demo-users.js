// Dev convenience script: ensures one demo login exists for each role
// (Admin, Tenant, Customer) so every portal can be exercised locally.
// Idempotent — safe to re-run, skips any account that already exists.
require('dotenv').config();
const db = require('../app/db/models');

const TENANT_ID = '07c97d5c-4108-11f0-96fd-c475ab7293c6';
const ADMIN_ROLE_ID = '6cff3d9f-02d8-11ef-8c8d-74563c332521';
const TENANT_ROLE_ID = '6cff3da0-02d8-11ef-8c8d-74563c332522';
const CUSTOMER_ROLE_ID = '6cff3da0-02d8-11ef-8c8d-74563c33253';

async function ensureAdminUser() {
    const existing = await db.User.findOne({ where: { email: 'john@example.com' }, disableTenantCheck: true });
    if (existing) {
        console.log('Admin user already exists:', existing.email);
        return;
    }

    const user = await db.User.create({
        tenantId: TENANT_ID,
        roleId: ADMIN_ROLE_ID,
        shortCode: 'Main1',
        firstName: 'John',
        lastName: 'Doe',
        gender: 'male',
        countryCode: 'IND',
        mobile: '9876543210',
        email: 'john@example.com',
        password: 'admin@123',
        passwordShow: 'admin@123',
        address: '5th Floor CHPL, WTT',
        birthDate: new Date('1990-01-01T00:00:00'),
        status: '1',
    });

    console.log('Created admin user:', user.email);
}

async function ensureTenantUser() {
    const existing = await db.User.findOne({ where: { email: 'manager@chpl.test' }, disableTenantCheck: true });
    if (existing) {
        console.log('Tenant user already exists:', existing.email);
        return;
    }

    const user = await db.User.create({
        tenantId: TENANT_ID,
        roleId: TENANT_ROLE_ID,
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

    console.log('Created tenant user:', user.email);
}

async function ensureCustomer() {
    const existing = await db.Customer.findOne({ where: { phoneNo: '9998877766' } });
    if (existing) {
        console.log('Customer already exists:', existing.phoneNo);
        return;
    }

    const customer = await db.Customer.create({
        roleId: CUSTOMER_ROLE_ID,
        firstName: 'Demo',
        lastName: 'Customer',
        gender: 'male',
        countryCode: 'IND',
        phoneNo: '9998877766',
        email: 'customer@chpl.test',
        verified: true,
        createdAt: new Date(),
    });

    console.log('Created customer:', customer.phoneNo);
}

async function run() {
    await ensureAdminUser();
    await ensureTenantUser();
    await ensureCustomer();
    process.exit(0);
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});

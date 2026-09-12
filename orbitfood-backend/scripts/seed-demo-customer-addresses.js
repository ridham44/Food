// Dev convenience script: gives each of the 10 named demo customers (created by
// seed-demo-tenants-and-history.js's ensureCustomers()) a saved "Home" delivery
// address, so the customer app's Addresses page / checkout flow has real data
// to show instead of the empty state. Idempotent — skips any customer that
// already has a saved address, safe to re-run.
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const db = require('../app/db/models');

// Same US country id seed-demo-tenants-and-history.js already relies on (GEO.countryId there).
const US_COUNTRY_ID = 'd0a12bfa-3a80-4a50-9273-f59da1322521';

// One address per named demo customer, in the same order they're created in
// seed-demo-tenants-and-history.js's CUSTOMER_TEMPLATE (see LOGIN_CREDENTIALS.md).
const ADDRESSES = [
    { phoneNo: '2125550201', addressLine: '1428 Elmwood Avenue', city: 'Los Angeles', state: 'California', pincode: '90012' },
    { phoneNo: '3105550202', addressLine: '742 Evergreen Terrace', city: 'Springfield', state: 'Illinois', pincode: '62704' },
    { phoneNo: '5125550203', addressLine: '305 Maple Drive', city: 'Austin', state: 'Texas', pincode: '78701' },
    { phoneNo: '3125550204', addressLine: '891 Whisper Pine Lane', city: 'Seattle', state: 'Washington', pincode: '98101' },
    { phoneNo: '4155550205', addressLine: '512 Ocean Breeze Boulevard', city: 'Miami', state: 'Florida', pincode: '33139' },
    { phoneNo: '2125550206', addressLine: '1609 Sycamore Street', city: 'Columbus', state: 'Ohio', pincode: '43215' },
    { phoneNo: '3105550207', addressLine: '234 Shadow Creek Court', city: 'Denver', state: 'Colorado', pincode: '80202' },
    { phoneNo: '5125550208', addressLine: '1075 Meadowbrook Lane', city: 'Atlanta', state: 'Georgia', pincode: '30303' },
    { phoneNo: '3125550209', addressLine: '621 Willow Bend Road', city: 'Boston', state: 'Massachusetts', pincode: '02110' },
    { phoneNo: '4155550210', addressLine: '455 Chestnut Ridge Way', city: 'Phoenix', state: 'Arizona', pincode: '85001' },
];

async function resolveGeo(stateName, cityName) {
    const state = await db.GeoState.findOne({ where: { countryId: US_COUNTRY_ID, name: stateName }, disableTenantCheck: true });
    if (!state) return { stateId: null, cityId: null };
    const city = await db.GeoCity.findOne({ where: { stateId: state.id, name: cityName }, disableTenantCheck: true });
    return { stateId: state.id, cityId: city ? city.id : null };
}

async function run() {
    for (const entry of ADDRESSES) {
        const customer = await db.Customer.findOne({ where: { phoneNo: entry.phoneNo }, disableTenantCheck: true });
        if (!customer) {
            console.log(`Skipping ${entry.phoneNo} — customer not found. Run seed-demo-tenants-and-history.js first.`);
            continue;
        }

        const existing = await db.CustomerAddress.findOne({ where: { customerId: customer.id }, disableTenantCheck: true });
        if (existing) {
            console.log(`Address already exists for ${customer.fullName}, skipping`);
            continue;
        }

        const { stateId, cityId } = await resolveGeo(entry.state, entry.city);
        if (!stateId) {
            console.log(`Could not resolve "${entry.state}" — is seed-geo-data.js run? Saving address without state/city.`);
        }

        await db.CustomerAddress.create(
            {
                id: uuidv4(),
                customerId: customer.id,
                label: 'Home',
                contactName: customer.fullName,
                contactPhone: customer.phoneNo,
                addressLine: entry.addressLine,
                countryId: US_COUNTRY_ID,
                stateId,
                cityId,
                pincode: entry.pincode,
                isDefault: true,
            },
            { disableTenantCheck: true }
        );
        console.log(`Added address for ${customer.fullName}: ${entry.addressLine}, ${entry.city}, ${entry.state} ${entry.pincode}`);
    }
}

run()
    .then(() => {
        console.log('\nDone.');
        process.exit(0);
    })
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });

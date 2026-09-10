// One-off dev/deploy script: populates geo_country / geo_state / geo_city
// from the "country-state-city" package (full ISO-based world dataset) so
// the Country -> State -> City cascade already wired into the customer
// profile/signup forms actually has data to show. Idempotent — skips if
// geo_country already has rows. Run: node scripts/seed-geo-data.js
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const { Country, State, City } = require('country-state-city');
const db = require('../app/db/models');

const truncate = (value, max) => (value ? String(value).slice(0, max) : null);

async function chunkedBulkCreate(model, records, chunkSize) {
    for (let i = 0; i < records.length; i += chunkSize) {
        const chunk = records.slice(i, i + chunkSize);
        await model.bulkCreate(chunk, { validate: false });
    }
}

async function run() {
    const existing = await db.GeoCountry.count();
    if (existing > 0) {
        console.log(`geo_country already has ${existing} rows — skipping. Delete existing rows first to reseed.`);
        process.exit(0);
    }

    const countries = Country.getAllCountries();
    const countryIdByIso = new Map();

    const countryRecords = countries.map((c) => {
        const id = uuidv4();
        countryIdByIso.set(c.isoCode, id);
        return {
            id,
            name: truncate(c.name, 50),
            countryCode: truncate(c.isoCode, 10),
            currencyCode: truncate(c.currency || 'USD', 6),
            telephonePrefix: truncate(c.phonecode || '0', 5),
            flag: c.flag || null,
            description: null,
            status: '1',
            createdAt: new Date(),
        };
    });
    await chunkedBulkCreate(db.GeoCountry, countryRecords, 500);
    console.log(`Seeded ${countryRecords.length} countries.`);

    const stateIdByIsoPair = new Map();
    const stateRecords = [];
    for (const c of countries) {
        const countryId = countryIdByIso.get(c.isoCode);
        const states = State.getStatesOfCountry(c.isoCode);
        for (const s of states) {
            const id = uuidv4();
            stateIdByIsoPair.set(`${c.isoCode}:${s.isoCode}`, id);
            stateRecords.push({
                id,
                name: truncate(s.name, 50),
                stateCode: truncate(s.isoCode, 5),
                countryId,
                description: null,
                status: '1',
                createdAt: new Date(),
            });
        }
    }
    await chunkedBulkCreate(db.GeoState, stateRecords, 1000);
    console.log(`Seeded ${stateRecords.length} states.`);

    let cityCount = 0;
    let skipped = 0;
    for (const c of countries) {
        const countryId = countryIdByIso.get(c.isoCode);
        const cities = City.getCitiesOfCountry(c.isoCode) || [];
        if (cities.length === 0) continue;

        const cityRecords = [];
        for (const city of cities) {
            const stateId = stateIdByIsoPair.get(`${city.countryCode}:${city.stateCode}`);
            if (!stateId) {
                skipped += 1;
                continue;
            }
            cityRecords.push({
                id: uuidv4(),
                name: truncate(city.name, 50),
                cityCode: null,
                countryId,
                stateId,
                description: null,
                status: '1',
                createdAt: new Date(),
            });
        }

        await chunkedBulkCreate(db.GeoCity, cityRecords, 3000);
        cityCount += cityRecords.length;
    }
    console.log(`Seeded ${cityCount} cities (skipped ${skipped} with no matching state).`);

    process.exit(0);
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});

// Dev convenience script: adds a few more approved US-based tenants plus
// realistic historical data (menu, combos, coupons + redemptions, customers,
// orders, bills, payments, points, ratings, expenses) so every admin/tenant
// dashboard and report has something real to show. Idempotent per tenant —
// keyed off companyName, safe to re-run (skips tenants that already exist).
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const db = require('../app/db/models');

const CUSTOMER_ROLE_ID = '6cff3da0-02d8-11ef-8c8d-74563c33253';

const GEO = {
    countryId: 'd0a12bfa-3a80-4a50-9273-f59da1322521', // United States
    california: { stateId: '56cf227a-924c-44f7-a267-575eb246d083', cityId: 'fbc0b982-586e-48d8-862d-668ada7552ff' }, // Los Angeles
    newYork: { stateId: '7c3ba09f-efe3-40b4-9e05-dcffc2238c90', cityId: 'b2793ace-265a-4f4e-825a-2673dd5d875b' }, // New York City
    texas: { stateId: '23357b8b-8435-43c9-8028-81eb04043ec0', cityId: 'c1ce5036-3529-44f7-8af5-94471bacea82' }, // Austin
};

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = Date.now();

function daysAgo(n, hour = 12, min = 0) {
    const d = new Date(NOW - n * DAY_MS);
    d.setHours(hour, min, Math.floor(Math.random() * 60), 0);
    return d;
}
function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr) {
    return arr[randInt(0, arr.length - 1)];
}
function round2(n) {
    return Math.round(n * 100) / 100;
}
/** Free, no-auth placeholder photo services — deterministic per seed string. */
function tenantPhoto(seed) {
    return `https://picsum.photos/seed/${encodeURIComponent(seed)}/640/400`;
}
function foodPhoto(keyword, lock) {
    return `https://loremflickr.com/480/360/${keyword}?lock=${lock}`;
}
function avatarPhoto(n) {
    return `https://i.pravatar.cc/300?img=${n}`;
}

const MENU_TEMPLATE = [
    {
        category: 'Starters',
        items: [
            { name: 'Buffalo Wings', price: 9.99, description: 'Crispy wings tossed in classic buffalo sauce', photo: 'wings' },
            { name: 'Loaded Nachos', price: 8.49, description: 'Tortilla chips with cheese, jalapenos, and salsa', photo: 'nachos' },
            { name: 'Mozzarella Sticks', price: 7.99, description: 'Breaded mozzarella, fried golden, marinara on the side', photo: 'cheese' },
            { name: 'Onion Rings', price: 6.49, description: 'Beer-battered onion rings with chipotle dip', photo: 'onionring' },
        ],
    },
    {
        category: 'Main Course',
        items: [
            { name: 'Classic Cheeseburger', price: 12.99, description: 'Angus beef patty, cheddar, lettuce, tomato, brioche bun', photo: 'burger' },
            { name: 'BBQ Bacon Burger', price: 14.49, description: 'Double patty with bacon, cheddar, and BBQ sauce', photo: 'burger' },
            { name: 'Grilled Chicken Sandwich', price: 11.99, description: 'Grilled chicken breast, avocado, chipotle mayo', photo: 'sandwich' },
            { name: 'Fish & Chips', price: 13.99, description: 'Beer-battered cod with fries and tartar sauce', photo: 'fishandchips' },
            { name: 'Caesar Salad', price: 10.49, description: 'Romaine, parmesan, croutons, classic caesar dressing', photo: 'salad' },
        ],
    },
    {
        category: 'Sides',
        items: [
            { name: 'French Fries', price: 3.99, description: 'Crispy golden fries, salted', photo: 'fries' },
            { name: 'Sweet Potato Fries', price: 4.49, description: 'Sweet potato fries with a hint of cinnamon', photo: 'fries' },
            { name: 'Mac & Cheese', price: 5.99, description: 'Creamy three-cheese mac & cheese', photo: 'macandcheese' },
        ],
    },
    {
        category: 'Beverages',
        items: [
            { name: 'Craft Lemonade', price: 3.49, description: 'Fresh-squeezed lemonade', photo: 'lemonade' },
            { name: 'Iced Tea', price: 2.99, description: 'House-brewed iced tea', photo: 'icedtea' },
            { name: 'Milkshake', price: 5.49, description: 'Vanilla, chocolate, or strawberry', photo: 'milkshake' },
            { name: 'Craft Soda', price: 2.49, description: 'Small-batch craft soda', photo: 'soda' },
        ],
    },
];

// American, celebrity-inspired first names — roughly 80% female / 20% male,
// per the requested demo persona mix.
const CUSTOMER_TEMPLATE = [
    { firstName: 'Emma', lastName: 'Wilson', phoneNo: '2125550201', email: 'emma.wilson@example.test', gender: 'female', avatar: 1 },
    { firstName: 'Olivia', lastName: 'Moore', phoneNo: '3105550202', email: 'olivia.moore@example.test', gender: 'female', avatar: 5 },
    { firstName: 'Ava', lastName: 'Thomas', phoneNo: '5125550203', email: 'ava.thomas@example.test', gender: 'female', avatar: 9 },
    { firstName: 'Isabella', lastName: 'Jackson', phoneNo: '3125550204', email: 'isabella.jackson@example.test', gender: 'female', avatar: 16 },
    { firstName: 'Mia', lastName: 'White', phoneNo: '4155550205', email: 'mia.white@example.test', gender: 'female', avatar: 20 },
    { firstName: 'Chloe', lastName: 'Harris', phoneNo: '2125550206', email: 'chloe.harris@example.test', gender: 'female', avatar: 24 },
    { firstName: 'Grace', lastName: 'Clark', phoneNo: '3105550207', email: 'grace.clark@example.test', gender: 'female', avatar: 28 },
    { firstName: 'Hannah', lastName: 'Lewis', phoneNo: '5125550208', email: 'hannah.lewis@example.test', gender: 'female', avatar: 32 },
    { firstName: 'James', lastName: 'Walker', phoneNo: '3125550209', email: 'james.walker@example.test', gender: 'male', avatar: 51 },
    { firstName: 'Michael', lastName: 'Young', phoneNo: '4155550210', email: 'michael.young@example.test', gender: 'male', avatar: 55 },
];

const NEW_TENANTS = [
    {
        companyName: 'Sunset Grill & Bar',
        shortCode: 'SGB',
        contactPerson: 'Megan Johnson',
        mobile: '3105550101',
        phone: '3105550111',
        email: 'owner@sunsetgrillbar.test',
        address: '4200 Sunset Blvd',
        zipCode: '90029',
        website: 'www.sunsetgrillbar.test',
        geo: GEO.california,
        waiterName: 'Kim Davis',
    },
    {
        companyName: 'Empire Bistro',
        shortCode: 'EMB',
        contactPerson: 'Robert Williams',
        mobile: '2125550102',
        phone: '2125550112',
        email: 'owner@empirebistro.test',
        address: '350 5th Ave',
        zipCode: '10118',
        website: 'www.empirebistro.test',
        geo: GEO.newYork,
        waiterName: 'Kylie Miller',
    },
    {
        companyName: 'Lone Star Diner',
        shortCode: 'LSD',
        contactPerson: 'Sophia Brown',
        mobile: '5125550103',
        phone: '5125550113',
        email: 'owner@lonestardiner.test',
        address: '600 Congress Ave',
        zipCode: '78701',
        website: 'www.lonestardiner.test',
        geo: GEO.texas,
        waiterName: 'Tim Anderson',
    },
];

async function ensureCustomers() {
    const customers = [];
    for (const c of CUSTOMER_TEMPLATE) {
        let customer = await db.Customer.findOne({ where: { phoneNo: c.phoneNo } });
        if (!customer) {
            customer = await db.Customer.create({
                id: uuidv4(),
                roleId: CUSTOMER_ROLE_ID,
                firstName: c.firstName,
                lastName: c.lastName,
                gender: c.gender,
                phoneNo: c.phoneNo,
                email: c.email,
                profileImage: avatarPhoto(c.avatar),
                countryCode: 'USA',
                countryId: GEO.countryId,
                verified: true,
                createdAt: daysAgo(randInt(60, 120)),
            });
            console.log('Created customer:', customer.firstName, customer.phoneNo);
        } else if (!customer.profileImage) {
            customer.profileImage = avatarPhoto(c.avatar);
            await customer.save();
        }
        customers.push(customer);
    }
    return customers;
}

async function createTenant(def) {
    const existing = await db.Tenant.findOne({ where: { companyName: def.companyName } });
    if (existing) {
        console.log('Tenant already exists:', def.companyName);
        return existing;
    }

    const approvedAt = daysAgo(randInt(45, 75));
    const slug = def.shortCode.toLowerCase();

    const tenant = await db.Tenant.create({
        id: uuidv4(),
        shortCode: def.shortCode,
        companyName: def.companyName,
        contactPerson: def.contactPerson,
        countryCode: 'USA',
        mobile: def.mobile,
        phoneCountryCode: '+1',
        phone: def.phone,
        email: def.email,
        address: def.address,
        countryId: GEO.countryId,
        stateId: def.geo.stateId,
        cityId: def.geo.cityId,
        zipCode: def.zipCode,
        gstNumber: null,
        panNumber: null,
        frontImage: tenantPhoto(`${slug}-front`),
        backImage: tenantPhoto(`${slug}-back`),
        website: def.website,
        status: '1',
        emailVerified: '1',
        emailVerifiedAt: approvedAt,
        createdAt: approvedAt,
        approvedAt,
        isOpen: true,
        openingTime: '10:00',
        closingTime: '23:00',
        acceptOrders: true,
        autoAcceptOrders: false,
        preparationTimeMinutes: randInt(15, 30),
    });

    const adminRole = await db.Role.create({
        id: uuidv4(),
        tenantId: tenant.id,
        name: 'Tenant' + tenant.companyName,
        type: '2',
        isAdmin: '0',
        remark: 'Main Tenant',
        status: '1',
        createdAt: approvedAt,
    });

    const waiterRole = await db.Role.create({
        id: uuidv4(),
        tenantId: tenant.id,
        name: 'Waiter',
        type: '2',
        isAdmin: '0',
        remark: 'Front-of-house staff',
        status: '1',
        createdAt: approvedAt,
    });

    const [firstName, ...rest] = def.contactPerson.split(' ');
    const lastName = rest.join(' ') || null;

    const adminUser = await db.User.create({
        id: uuidv4(),
        tenantId: tenant.id,
        roleId: adminRole.id,
        shortCode: def.shortCode,
        firstName,
        lastName,
        gender: 'female',
        countryCode: 'USA',
        mobile: def.mobile,
        email: def.email,
        password: 'tenant@123',
        passwordShow: 'tenant@123',
        address: def.address,
        countryId: GEO.countryId,
        stateId: def.geo.stateId,
        cityId: def.geo.cityId,
        zipCode: def.zipCode,
        birthDate: new Date('1990-01-01T00:00:00'),
        status: '1',
        createdAt: approvedAt,
    });

    const [waiterFirst, ...waiterRest] = def.waiterName.split(' ');
    await db.User.create({
        id: uuidv4(),
        tenantId: tenant.id,
        roleId: waiterRole.id,
        shortCode: def.shortCode.slice(0, 4) + 'W',
        firstName: waiterFirst,
        lastName: waiterRest.join(' ') || null,
        gender: 'female',
        countryCode: 'USA',
        mobile: '9' + String(randInt(100000000, 999999999)),
        email: `waiter@${slug}.test`,
        password: 'waiter@123',
        passwordShow: 'waiter@123',
        address: def.address,
        birthDate: new Date('1995-01-01T00:00:00'),
        status: '1',
        createdAt: approvedAt,
    });

    await db.TaxConfig.create({
        id: uuidv4(),
        tenantId: tenant.id,
        gst: 8.5, // sales tax %
        packingFee: 1.5,
        status: '1',
        createdAt: approvedAt,
    });

    const tableDefs = [
        { tableNumber: 'T1', capacity: 2, section: 'Indoor' },
        { tableNumber: 'T2', capacity: 4, section: 'Indoor' },
        { tableNumber: 'T3', capacity: 4, section: 'Patio' },
        { tableNumber: 'T4', capacity: 6, section: 'Patio' },
    ];
    for (const t of tableDefs) {
        await db.RestaurantTable.create({
            id: uuidv4(),
            tenantId: tenant.id,
            tableNumber: t.tableNumber,
            capacity: t.capacity,
            section: t.section,
            status: 'available',
            createdBy: adminUser.id,
            createdAt: approvedAt,
        });
    }

    const vendor = await db.Vendor.create({
        id: uuidv4(),
        tenantId: tenant.id,
        name: `${def.companyName.split(' ')[0]} Fresh Produce Supplies`,
        contactPerson: 'Supplier Contact',
        phone: '8' + String(randInt(100000000, 999999999)),
        email: `supplies@${slug}vendor.test`,
        address: 'Local wholesale market',
        status: '1',
        createdAt: approvedAt,
    });

    const inventoryDefs = [
        { ingredientName: 'Ground Beef', category: 'Meat', unit: 'lb', currentStock: 40, minimumLevel: 10 },
        { ingredientName: 'Cheddar Cheese', category: 'Dairy', unit: 'lb', currentStock: 15, minimumLevel: 5 },
        { ingredientName: 'Russet Potatoes', category: 'Produce', unit: 'lb', currentStock: 60, minimumLevel: 20 },
    ];
    for (const inv of inventoryDefs) {
        await db.InventoryItem.create({
            id: uuidv4(),
            tenantId: tenant.id,
            ...inv,
            createdBy: adminUser.id,
            createdAt: approvedAt,
        });
    }

    const expenseDefs = [
        { title: 'Grocery & produce restock', category: 'Kitchen', amount: 420, daysBack: 20 },
        { title: 'Electricity bill', category: 'Utilities', amount: 680, daysBack: 35 },
        { title: 'Kitchen equipment repair', category: 'Maintenance', amount: 250, daysBack: 12 },
        { title: 'Propane refill', category: 'Kitchen', amount: 180, daysBack: 5 },
    ];
    for (const exp of expenseDefs) {
        const d = daysAgo(exp.daysBack);
        await db.ExpenseEntry.create({
            id: uuidv4(),
            tenantId: tenant.id,
            title: exp.title,
            amount: exp.amount,
            date: d.toISOString().slice(0, 10),
            category: exp.category,
            paymentMode: pick(['Cash', 'Card', 'UPI', 'Bank Transfer']),
            remarks: null,
            createdBy: adminUser.id,
            createdAt: d,
        });
    }

    console.log('Created tenant:', tenant.companyName);
    return tenant;
}

async function seedMenu(tenant, adminUserId) {
    const existingCount = await db.Menu.count({ where: { tenantId: tenant.id } });
    if (existingCount > 0) {
        console.log(`Menu already seeded for ${tenant.companyName} (${existingCount} rows)`);
        return db.Menu.findAll({ where: { tenantId: tenant.id } });
    }

    const created = [];
    let photoLock = 1;
    for (const group of MENU_TEMPLATE) {
        const category = await db.Menu.create({
            id: uuidv4(),
            parentId: null,
            name: group.category,
            price: null,
            description: `${group.category} menu`,
            tenantId: tenant.id,
            isAvailable: '1',
            createdBy: adminUserId,
            createdAt: daysAgo(60),
        });
        created.push(category);

        for (const item of group.items) {
            const menuItem = await db.Menu.create({
                id: uuidv4(),
                parentId: category.id,
                name: item.name,
                price: item.price,
                description: item.description,
                filePath: foodPhoto(item.photo, photoLock++),
                tenantId: tenant.id,
                isAvailable: '1',
                createdBy: adminUserId,
                createdAt: daysAgo(60),
            });
            created.push(menuItem);
        }
    }
    console.log(`Seeded ${created.length} menu rows for ${tenant.companyName}`);
    return created;
}

async function seedCombos(tenant, menuItems) {
    const existing = await db.ComboGroup.count({ where: { tenantId: tenant.id } });
    if (existing > 0) {
        console.log(`Combos already seeded for ${tenant.companyName}`);
        const existingCombos = await db.ComboGroup.findAll({ where: { tenantId: tenant.id } });
        for (const combo of existingCombos) {
            const items = await db.ComboGroupItem.findAll({ where: { comboGroupId: combo.id }, raw: true });
            combo.dataValues.menuIds = items.map((i) => i.menuId);
        }
        return existingCombos;
    }

    const foodItems = menuItems.filter((m) => m.parentId && Number(m.price) > 0);
    const mains = foodItems.filter((m) => Number(m.price) >= 6);
    const sides = foodItems.filter((m) => Number(m.price) < 6);

    const comboDefs = [
        { name: `${mains[0]?.name || 'Meal'} + ${sides[0]?.name || 'Side'} Combo`, buy: mains[0], get: sides[0], discountPct: 0.15 },
        { name: `${mains[1]?.name || 'Meal'} + ${sides[1]?.name || 'Side'} Combo`, buy: mains[1], get: sides[1], discountPct: 0.12 },
    ];

    const combos = [];
    for (const def of comboDefs) {
        if (!def.buy || !def.get) continue;
        const fullPrice = Number(def.buy.price) + Number(def.get.price);
        const comboPrice = round2(fullPrice * (1 - def.discountPct));

        const combo = await db.ComboGroup.create({
            id: uuidv4(),
            tenantId: tenant.id,
            name: def.name,
            isActive: '1',
            price: comboPrice,
            createdAt: daysAgo(55),
        });

        await db.ComboGroupItem.bulkCreate([
            { id: uuidv4(), comboGroupId: combo.id, menuId: def.buy.id, quantity: 1, type: 'buy' },
            { id: uuidv4(), comboGroupId: combo.id, menuId: def.get.id, quantity: 1, type: 'get' },
        ]);

        // menu_rating.menuId is NOT NULL even for combo-based ratings (the
        // real /menu-rating API always rates a specific leaf item, using
        // comboItemId only to note which combo it was ordered as part of) —
        // stash the combo's constituent menu ids so seedOrders can rate one.
        combo.dataValues.menuIds = [def.buy.id, def.get.id];
        combos.push(combo);
    }
    console.log(`Seeded ${combos.length} combos for ${tenant.companyName}`);
    return combos;
}

async function seedCoupons(tenant, customers) {
    const existing = await db.DiscountCoupon.count({ where: { tenantId: tenant.id } });
    if (existing > 0) {
        console.log(`Coupons already seeded for ${tenant.companyName}`);
        return db.DiscountCoupon.findAll({ where: { tenantId: tenant.id } });
    }

    const validFrom = daysAgo(90);
    const validTo = daysAgo(-60); // 60 days in the future

    const welcome = await db.DiscountCoupon.create({
        id: uuidv4(),
        tenantId: tenant.id,
        code: 'WELCOME10',
        type: 'percent',
        value: 10,
        maxUsage: 100,
        minOrderAmount: 15,
        isPublic: true,
        isActive: '1',
        validFrom,
        validTo,
        description: '10% off for every customer, min order $15',
        createdAt: validFrom,
    });

    const vip = await db.DiscountCoupon.create({
        id: uuidv4(),
        tenantId: tenant.id,
        code: `${tenant.shortCode}VIP5`,
        type: 'flat',
        value: 5,
        maxUsage: 3,
        minOrderAmount: 20,
        isPublic: false,
        isActive: '1',
        validFrom,
        validTo,
        description: 'Flat $5 off for selected loyal customers',
        createdAt: validFrom,
    });

    const vipCustomers = customers.slice(0, 3);
    await db.DiscountCouponUser.bulkCreate(
        vipCustomers.map((c) => ({
            id: uuidv4(),
            couponId: vip.id,
            customerId: c.id,
            usedCount: 0,
        }))
    );

    console.log(`Seeded 2 coupons for ${tenant.companyName}`);
    return [welcome, vip];
}

async function seedOrders(tenant, menuItems, combos, customers, coupons, taxConfig) {
    const existing = await db.OrderList.count({ where: { tenantId: tenant.id } });
    if (existing > 0) {
        console.log(`Orders already seeded for ${tenant.companyName} (${existing})`);
        return;
    }

    const orderableMenu = menuItems.filter((m) => m.parentId && Number(m.price) > 0);
    const [publicCoupon, vipCoupon] = coupons;
    const gst = taxConfig ? Number(taxConfig.gst) : 8.5;
    const packingFeeFlat = taxConfig ? Number(taxConfig.packingFee) : 1.5;

    const ORDER_COUNT = 22;
    let ordersCreated = 0;

    for (let i = 0; i < ORDER_COUNT; i++) {
        const daysBack = i < 3 ? randInt(0, 1) : randInt(0, 55);
        const createdAt = daysAgo(daysBack, randInt(11, 21), randInt(0, 59));
        const customer = pick(customers);
        const isParcel = Math.random() < 0.35;
        const orderType = isParcel ? pick(['takeaway', 'delivery']) : 'dine_in';
        const placedBy = Math.random() < 0.6 ? '1' : '2';

        const roll = Math.random();
        let orderStatus;
        if (roll < 0.7) orderStatus = '2'; // approved
        else if (roll < 0.85) orderStatus = '3'; // cancelled
        else orderStatus = '1'; // pending

        const orderListId = uuidv4();
        const useCombo = combos.length > 0 && Math.random() < 0.3;
        const itemCount = randInt(1, 3);
        const chosenItems = [];
        for (let j = 0; j < itemCount; j++) {
            if (useCombo && j === 0) {
                chosenItems.push({ combo: pick(combos) });
            } else {
                chosenItems.push({ menu: pick(orderableMenu) });
            }
        }

        let kitchenStatus = 'new';
        let cancelReason = null;
        let cancelledBy = null;
        if (orderStatus === '2') {
            kitchenStatus = daysBack === 0 ? pick(['new', 'preparing', 'ready']) : 'completed';
        } else if (orderStatus === '3') {
            cancelReason = pick(['Customer changed mind', 'Item out of stock', 'Duplicate order', 'Long wait time']);
            cancelledBy = pick(['0', '1']);
        }

        await db.OrderList.create({
            id: orderListId,
            customerId: customer.id,
            placedBy,
            status: orderStatus,
            tenantId: tenant.id,
            isParcel: isParcel ? '1' : '0',
            kitchenStatus,
            orderType,
            tableNumber: orderType === 'dine_in' ? String(randInt(1, 4)) : null,
            cancelReason,
            cancelledBy,
            createdAt,
            updatedAt: createdAt,
        });

        let totalAmount = 0;
        const orderItemRows = [];
        for (const chosen of chosenItems) {
            const quantity = randInt(1, 2);
            if (chosen.menu) {
                const totalPrice = round2(Number(chosen.menu.price) * quantity);
                totalAmount += totalPrice;
                orderItemRows.push({
                    id: uuidv4(),
                    orderListId,
                    menuId: chosen.menu.id,
                    comboId: null,
                    quantity,
                    specialInstruction: Math.random() < 0.15 ? 'No onions please' : null,
                    totalPrice,
                    createdAt,
                });
            } else if (chosen.combo) {
                const totalPrice = round2(Number(chosen.combo.price) * quantity);
                totalAmount += totalPrice;
                orderItemRows.push({
                    id: uuidv4(),
                    orderListId,
                    menuId: null,
                    comboId: chosen.combo.id,
                    quantity,
                    specialInstruction: null,
                    totalPrice,
                    createdAt,
                });
            }
        }
        await db.OrderItem.bulkCreate(orderItemRows);

        if (orderStatus === '2') {
            const packingFee = isParcel ? packingFeeFlat : 0;
            const gstAmount = round2((totalAmount * gst) / 100);

            let couponCode = null;
            let discountAmount = 0;
            let pointsUsed = 0;

            const useCoupon = Math.random() < 0.35;
            if (useCoupon && totalAmount >= 15) {
                if (Math.random() < 0.5) {
                    couponCode = publicCoupon.code;
                    discountAmount = round2(totalAmount * (Number(publicCoupon.value) / 100));
                } else if (totalAmount >= 20) {
                    couponCode = vipCoupon.code;
                    discountAmount = Number(vipCoupon.value);
                    await db.DiscountCouponUser.update(
                        { usedCount: db.Sequelize.literal('usedCount + 1') },
                        { where: { couponId: vipCoupon.id, customerId: customer.id } }
                    );
                }
            } else if (Math.random() < 0.15) {
                pointsUsed = randInt(2, 5);
                discountAmount = pointsUsed;
            }

            const finalAmount = round2(totalAmount + gstAmount + packingFee - discountAmount);

            const bill = await db.OrderBill.create({
                id: uuidv4(),
                orderListId,
                totalAmount: round2(totalAmount),
                couponCode,
                discountAmount,
                finalAmount,
                pointsUsed,
                status: Math.random() < 0.85 ? '1' : '0',
                packingFee,
                gstPercent: gst,
                createdAt,
            });

            if (bill.status === '1') {
                const mode = pick(['cash', 'card', 'online', 'split']);
                const payment = { cash: 0, card: 0, online: 0 };
                if (mode === 'split') {
                    payment.cash = round2(finalAmount * 0.4);
                    payment.online = round2(finalAmount - payment.cash);
                } else {
                    payment[mode] = finalAmount;
                }
                await db.OrderPayment.create({
                    id: uuidv4(),
                    orderBillId: bill.id,
                    ...payment,
                    amountPaid: finalAmount,
                    status: 'paid',
                    createdAt,
                });
            }

            if (Math.random() < 0.4) {
                const ratedItem = chosenItems[0];
                const ratedMenuId = ratedItem.menu ? ratedItem.menu.id : pick(ratedItem.combo.dataValues.menuIds);
                await db.MenuRating.create({
                    id: uuidv4(),
                    orderId: orderListId,
                    menuId: ratedMenuId,
                    comboItemId: ratedItem.combo ? ratedItem.combo.id : null,
                    customerId: customer.id,
                    rating: randInt(3, 5),
                    review: pick([
                        'Great taste, will order again!',
                        'Good food, delivered on time.',
                        'Loved it, highly recommend.',
                        'Decent, could be better packaged.',
                        null,
                    ]),
                    createdAt,
                });
            }
        }

        ordersCreated += 1;
    }

    console.log(`Seeded ${ordersCreated} orders for ${tenant.companyName}`);
}

async function seedCustomerPoints(customers) {
    for (const customer of customers) {
        const existing = await db.CustomerPoints.findOne({ where: { customerId: customer.id } });
        if (existing) continue;

        const orderCount = await db.OrderList.count({ where: { customerId: customer.id } });
        if (orderCount === 0) continue;

        await db.CustomerPoints.create({
            id: uuidv4(),
            customerId: customer.id,
            totalPoints: randInt(0, 25),
            currentOrderCount: orderCount % 10,
            bonusPosition: randInt(1, 10),
            createdAt: daysAgo(60),
            updatedAt: daysAgo(1),
        });
    }
    console.log('Seeded customer points balances');
}

async function run() {
    const customers = await ensureCustomers();

    for (const def of NEW_TENANTS) {
        const tenant = await createTenant(def);
        const adminUser = await db.User.findOne({ where: { tenantId: tenant.id, email: def.email } });
        const menuItems = await seedMenu(tenant, adminUser ? adminUser.id : null);
        const combos = await seedCombos(tenant, menuItems);
        const coupons = await seedCoupons(tenant, customers);
        const taxConfig = await db.TaxConfig.findOne({ where: { tenantId: tenant.id } });
        await seedOrders(tenant, menuItems, combos, customers, coupons, taxConfig);
    }

    await seedCustomerPoints(customers);

    console.log('\nDone. New tenant admin logins (password: tenant@123):');
    for (const def of NEW_TENANTS) {
        console.log(` - ${def.companyName}: ${def.email}`);
    }
}

run()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });

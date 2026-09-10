const db = require('../../../db/models');
const { askGroqFast, askGroqAccurate, chatCompletion } = require('../../../../utils/lib/groqClient');
const { status } = require('../../../../utils');
const { Op } = require('sequelize');
const { sequelize } = db;

exports.chatWithTools = async (req, res) => {
    try {
        const { messages, tools } = req.body;
        if (!messages || !Array.isArray(messages)) {
            return res.status(status.BadRequest).json({ message: 'Messages array is required.' });
        }
        const responseMessage = await chatCompletion(messages, tools);
        return res.status(status.OK).json({ message: responseMessage });
    } catch (err) {
        console.error('chatWithTools Error:', err.message);
        return res.status(status.InternalServerError).json({ message: 'Internal server error' });
    }
};

exports.askOrderAI = async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const { question } = req.body;

        if (!question) {
            return res.status(status.BadRequest).json({ message: 'Question is required.' });
        }

        if (!tenantId) {
            return res.status(status.Unauthorized).json({ message: 'Unauthorized: Tenant ID not found in token.' });
        }

        const orders = await db.OrderList.findAll({
            where: { tenantId },
            include: [
                {
                    model: db.Customer,
                    as: 'Customer',
                    attributes: ['id', 'firstName', 'lastName', 'phoneNo'],
                },
                {
                    model: db.OrderItem,
                    as: 'OrderItem',
                    include: [
                        {
                            model: db.Menu,
                            as: 'Menu',
                            attributes: ['id', 'name', 'price'],
                            disableTenantCheck: true,
                        },
                        {
                            model: db.ComboGroup,
                            as: 'ComboGroup',
                            attributes: ['id', 'name', 'price'],
                            include: [
                                {
                                    model: db.ComboGroupItem,
                                    as: 'ComboGroupItems',
                                    attributes: ['id', 'menuId', 'quantity', 'type'],
                                    disableTenantCheck: true,
                                },
                            ],
                            disableTenantCheck: true,
                        },
                    ],
                },
                {
                    model: db.OrderBill,
                    as: 'OrderBill',
                    attributes: ['id', 'totalAmount', 'discountAmount', 'couponCode', 'finalAmount', 'pointsUsed', 'status', 'createdAt'],
                    required: false,
                    include: [
                        {
                            model: db.OrderPayment,
                            as: 'OrderPayment',
                            attributes: ['id', 'cash', 'card', 'online', 'amountPaid', 'status', 'createdAt'],
                            required: false,
                        },
                    ],
                },
            ],
            order: [['createdAt', 'DESC']],
        });

        const formattedOrders = orders.map((order) => {
            const bill = order.OrderBill?.[0];

            const payment = bill?.OrderPayment?.[0];

            return {
                id: order.id,
                customer: order.Customer
                    ? {
                          id: order.Customer.id,
                          name: `${order.Customer.firstName || ''} ${order.Customer.lastName || ''}`.trim(),
                          phone: order.Customer.phoneNo,
                      }
                    : null,
                placed_by: order.placedBy === '1' ? 'Customer' : 'Tenant',
                status:
                    order.status === '1' ? 'Pending' : order.status === '2' ? 'Confirmed' : order.status === '3' ? 'Cancelled' : 'Unknown',
                cancel_reason: order.cancelReason || '',
                cancelled_by: order.cancelledBy === '0' ? 'Customer' : order.cancelledBy === '1' ? 'Tenant' : '',
                created_at: order.createdAt,
                updated_at: order.updatedAt,
                items: order.OrderItem.map((item) => ({
                    quantity: item.quantity,
                    menu: item.Menu
                        ? {
                              id: item.Menu.id,
                              name: item.Menu.name,
                              price: item.Menu.price,
                          }
                        : null,
                    combo_group: item.ComboGroup
                        ? {
                              id: item.ComboGroup.id,
                              name: item.ComboGroup.name,
                              price: item.ComboGroup.price,
                          }
                        : null,
                    combo_group_item: item.ComboGroupItem
                        ? {
                              id: item.ComboGroupItem.id,
                              comboGroupId: item.ComboGroupItem.comboGroupId,
                              menuId: item.ComboGroupItem.menuId,
                              quantity: item.ComboGroupItem.quantity,
                              type: item.ComboGroupItem.type,
                          }
                        : null,
                })),

                bill: bill
                    ? {
                          id: bill.id,
                          totalAmount: bill.totalAmount,
                          discountAmount: bill.discountAmount,
                          couponCode: bill.couponCode,
                          finalAmount: bill.finalAmount,
                          pointsUsed: bill.pointsUsed,
                          paymentStatus: bill.status === '1' ? 'Paid' : bill.status === '0' ? 'Unpaid' : 'Unknown',
                          createdAt: bill.createdAt,
                      }
                    : null,

                payment: payment
                    ? {
                          id: payment.id,
                          cash: payment.cash,
                          card: payment.card,
                          online: payment.online,
                          amountPaid: payment.amountPaid,
                          status: payment.status === 'paid' ? 'Paid' : 'Failed',
                          createdAt: payment.createdAt,
                      }
                    : null,
            };
        });

        const prompt = `

You are a highly accurate and precise data analyst for a food ordering system. Your sole task is to answer the user's question **only** based on the provided order dataset JSON.

**System Date:** ${new Date().toUTCString()}

**User Question:**  
"${question}"

**Order Dataset (JSON):**  
${JSON.stringify(formattedOrders, null, 2)}

---

### RULES (Strictly follow these, no exceptions):

1. Use **ONLY** the data in the provided JSON.  
2. Do **NOT** guess, infer, or hallucinate any information not explicitly present.  
3. Distinguish clearly between **"coupon names"** and **"combo group names"**:  
   - The dataset contains a field **DiscountCoupon.name** representing coupon names.  
   - The field **ComboGroup.name** represents combo group names and should NOT be used as coupon names.  
   - If the user asks for coupon names, return **only** from DiscountCoupon.name.  
4. Apply exact **time filters** on the createdAt field according to the user's question (e.g., "last month" means all orders where createdAt is within last month relative to the system date).  
5. If a field is missing, null, or empty, respond with **"Not available"**.  
6. Use local currency symbol **₹** and IST time format (YYYY-MM-DD hh:mm A IST) for any dates or currency values in output.  
7. Format your output clearly, in short bullet points or tables as requested by the user.  
8. If no matching records are found after applying filters, respond exactly: **"No matching orders found."**  
9. If the question is unrelated to the dataset, respond: **"This question is not answerable from the provided data."**  
10. Do **NOT** include any internal process details or backend logic in your answer—only the final, precise data results.  
11. Be deterministic and consistent: the same question and data produce the same answer every time.  
12. Prioritize accuracy over verbosity. Only return what the data supports.

---

Answer the question now, strictly following these rules.`;

        const answer = await askGroqFast(prompt);

        res.status(status.OK).json({ message: answer });
    } catch (error) {
        console.error('askOrderAI Error:', error.message);
        return res.status(status.InternalServerError).json({ message: 'Internal server error' });
    }
};

const userHistory = new Map();

exports.askTenantAI = async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const userId = req.user?.id;
        const { question } = req.body;

        // Store conversation history
        const addToHistory = (userId, question, dataset, answer) => {
            if (!userHistory.has(userId)) userHistory.set(userId, []);
            const history = userHistory.get(userId);
            history.push({ question, dataset, answer, timestamp: new Date() });
            if (history.length > 5) history.shift();
            userHistory.set(userId, history);
        };

        const getLastHistory = (userId) => {
            const history = userHistory.get(userId);
            return history && history.length > 0 ? history[history.length - 1] : null;
        };

        const detectFollowUp = (newQ, lastQ) => {
            const lowerQ = newQ.toLowerCase();
            const vagueRefs = [
                'previous',
                'above',
                'those',
                'them',
                'last',
                'again',
                'same',
                'continue',
                'earlier',
                'from before',
                'from given data',
                'from previous data',
                'from above data',
            ];
            const hasVagueRef = vagueRefs.some((word) => lowerQ.includes(word));

            const hasNoSubject = lowerQ.split(' ').length <= 5;

            const lastWords = lastQ ? lastQ.toLowerCase().split(' ') : [];
            const sharedWords = lastWords.filter((w) => lowerQ.includes(w) && w.length > 3);

            return hasVagueRef || hasNoSubject || sharedWords.length > 0;
        };

        const now = new Date();
        const startOfDay = (d) => new Date(d.setHours(0, 0, 0, 0));
        const endOfDay = (d) => new Date(d.setHours(23, 59, 59, 999));

        const timeMap = {
            today: () => ({ createdAt: { [Op.between]: [startOfDay(new Date()), endOfDay(new Date())] } }),
            yesterday: () => {
                const temp = new Date();
                temp.setDate(temp.getDate() - 1);
                return { createdAt: { [Op.between]: [startOfDay(temp), endOfDay(temp)] } };
            },
            'this week': () => {
                const curr = new Date();
                const first = curr.getDate() - curr.getDay();
                const last = first + 6;
                return { createdAt: { [Op.between]: [startOfDay(new Date(curr.setDate(first))), endOfDay(new Date(curr.setDate(last)))] } };
            },
            'last week': () => {
                const curr = new Date();
                const first = curr.getDate() - curr.getDay() - 7;
                const last = first + 6;
                return { createdAt: { [Op.between]: [startOfDay(new Date(curr.setDate(first))), endOfDay(new Date(curr.setDate(last)))] } };
            },
            'this month': () => {
                const start = new Date(now.getFullYear(), now.getMonth(), 1);
                const end = endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));
                return { createdAt: { [Op.between]: [start, end] } };
            },
            'last month': () => {
                const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const end = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));
                return { createdAt: { [Op.between]: [start, end] } };
            },
            'this year': () => {
                const start = new Date(now.getFullYear(), 0, 1);
                const end = endOfDay(new Date(now.getFullYear(), 11, 31));
                return { createdAt: { [Op.between]: [start, end] } };
            },
            'last year': () => {
                const start = new Date(now.getFullYear() - 1, 0, 1);
                const end = endOfDay(new Date(now.getFullYear() - 1, 11, 31));
                return { createdAt: { [Op.between]: [start, end] } };
            },
        };

        // Dataset fetcher
        const fetchTenantDataset = async (tenantId, question) => {
            let dateFilter = {};
            for (const key in timeMap) {
                if (new RegExp(key, 'i').test(question)) {
                    dateFilter = timeMap[key]();
                    break;
                }
            }
            const fetchOrders =
                /order|orders|sales|revenue|bill|bills|invoice|invoices|payment|payments|purchase|purchases|booking|bookings|transaction|transactions|amount paid|amount due/i.test(
                    question
                );

            const fetchMenu =
                /menu|menus|item|items|dish|dishes|food|product|products|combo|combos|meal|meals|beverage|drink|drinks|category|categories|addon|add-ons|extra|extras/i.test(
                    question
                );

            const fetchCustomer =
                /customer|customers|client|clients|loyalty|points|member|members|membership|guest|guests|user|users|buyer|buyers|patron|patrons/i.test(
                    question
                );

            const fetchExpense =
                /expense|expenses|profit|loss|cost|costs|spend|spent|spending|overhead|overheads|financial|expenditure|investment|investments|capital/i.test(
                    question
                );

            const fetchDiscount =
                /discount|discounts|coupon|coupons|offer|offers|promotion|promotions|promo|promos|deal|deals|voucher|vouchers|code|codes/i.test(
                    question
                );

            const fetchTax = /tax|taxes|gst|vat|service tax|service charge|packing fee|packaging fee|surcharge|duty|levy|cess/i.test(
                question
            );

            const fetchVendor =
                /vendor|vendors|supplier|suppliers|provider|providers|ingredient|ingredients|stock|stocks|inventory|purchase order|po|deliveries|delivery|shipment|shipments|wholesaler|wholesalers/i.test(
                    question
                );

            const promises = [
                db.Tenant.findOne({
                    where: { id: tenantId },
                    attributes: ['id', 'companyName', 'address', 'gstNumber'],
                }),
            ];

            if (fetchMenu) {
                promises.push(db.Menu.findAll({ where: { tenantId }, limit: 10 }));
                promises.push(db.ComboGroup.findAll({ where: { tenantId }, limit: 5 }));
            }
            if (fetchCustomer) {
                promises.push(db.Customer.findAll({ limit: 20 }));
                promises.push(db.CustomerPoints.findAll({ limit: 20 }));
            }
            if (fetchDiscount) {
                promises.push(db.DiscountCoupon.findAll({ where: { tenantId }, limit: 10 }));
                promises.push(db.DiscountCouponUser.findAll({ limit: 20 }));
            }
            if (fetchExpense) {
                promises.push(db.ExpenseEntry.findAll({ where: { tenantId }, limit: 20 }));
            }
            if (fetchTax) {
                promises.push(db.TaxConfig.findOne({ where: { tenantId } }));
            }
            if (fetchVendor) {
                promises.push(
                    db.Vendor.findAll({
                        where: { tenantId },
                        include: [
                            {
                                model: db.VendorItem,
                                as: 'VendorItems',
                                attributes: ['id', 'ingredientName', 'category', 'costPerUnit', 'unit', 'status'],
                            },
                        ],
                        limit: 20,
                    })
                );
            }
            if (fetchOrders) {
                promises.push(
                    db.OrderList.findAll({
                        where: { tenantId, ...dateFilter },
                        limit: 50,
                        order: [['createdAt', 'DESC']],
                        include: [
                            {
                                model: db.Customer,
                                as: 'Customer',
                                attributes: [
                                    'id',
                                    [
                                        sequelize.fn(
                                            'CONCAT',
                                            sequelize.col('Customer.firstName'),
                                            ' ',
                                            sequelize.col('Customer.lastName')
                                        ),
                                        'name',
                                    ],
                                    ['phoneNo', 'gender'],
                                ],
                            },
                            {
                                model: db.OrderItem,
                                as: 'OrderItem',
                                attributes: ['menuId', 'comboId', 'quantity', 'totalPrice'],
                                include: [
                                    { model: db.Menu, as: 'Menu', attributes: ['name'] },
                                    { model: db.ComboGroup, as: 'ComboGroup', attributes: ['name'] },
                                ],
                            },
                            {
                                model: db.OrderBill,
                                as: 'OrderBill',
                                attributes: ['id', 'totalAmount', 'finalAmount', 'status', 'createdAt'],
                                include: [
                                    {
                                        model: db.OrderPayment,
                                        as: 'OrderPayment',
                                        attributes: ['id', 'cash', 'card', 'online', 'amountPaid', 'status', 'createdAt'],
                                    },
                                ],
                            },
                        ],
                    })
                );
            }

            const results = await Promise.all(promises);
            return results.filter(Boolean);
        };

        // Prompt generator
        const generatePrompt = (question, dataset) => `
### RULES:
1. Use ONLY provided data. Never guess or infer.
2. Time filters ("today", "last month", etc.) must match exactly with createdAt.
3. Missing/null fields → "Not available".
4. Support all relevant queries.
5. ₹ for currency, IST time.
6. Correct spelling and grammar given by user. Preprocess → normalize spaces, lowercase where needed, fix typos.
7. Structured output → follow format.
8. Irrelevant → "This question is not answerable from the provided data."
9. No results → "No matching orders found."
**System Date:** ${new Date().toUTCString()}
**Question:** "${question}"
**Dataset:** ${JSON.stringify(dataset)}
        `;

        let dataset;
        let isFollowUp = false;
        const lastHist = getLastHistory(userId);

        if (lastHist && detectFollowUp(question, lastHist.question)) {
            dataset = lastHist.dataset;
            isFollowUp = true;
        }

        if (!dataset) {
            dataset = await fetchTenantDataset(tenantId, question);
        }

        const prompt = generatePrompt(question, dataset);
        const answer = await askGroqAccurate(prompt);

        addToHistory(userId, question, dataset, answer);

        return res.status(status.OK).json({ message: answer, followUp: isFollowUp });
    } catch (err) {
        console.error('askTenantAI Error:', err);
        return res.status(status.InternalServerError).json({ message: 'Internal server error' });
    }
};

exports.askAdminAI = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { question, mode } = req.body || {};

        if (!question || typeof question !== 'string' || !question.trim()) {
            return res.status(status.BadRequest).json({ message: 'Question is required.' });
        }

        if (!global.adminHistory) global.adminHistory = new Map();

        const detectFollowUp = (newQ, lastQ) => {
            const lowerQ = (newQ || '').toLowerCase();
            const vagueRefs = [
                'previous',
                'above',
                'those',
                'them',
                'last',
                'again',
                'same',
                'continue',
                'earlier',
                'from before',
                'from given data',
                'from previous data',
                'from above data',
            ];
            const hasVagueRef = vagueRefs.some((w) => lowerQ.includes(w));
            const hasNoSubject = lowerQ.split(' ').length <= 5;
            const lastWords = lastQ ? lastQ.toLowerCase().split(' ') : [];
            const sharedWords = lastWords.filter((w) => lowerQ.includes(w) && w.length > 3);
            return hasVagueRef || hasNoSubject || sharedWords.length > 0;
        };

        const now = new Date();
        const startOfDay = (d) => new Date(d.setHours(0, 0, 0, 0));
        const endOfDay = (d) => new Date(d.setHours(23, 59, 59, 999));
        const timeMap = {
            today: () => ({ createdAt: { [Op.between]: [startOfDay(new Date()), endOfDay(new Date())] } }),
            yesterday: () => {
                const t = new Date();
                t.setDate(t.getDate() - 1);
                return { createdAt: { [Op.between]: [startOfDay(t), endOfDay(t)] } };
            },
            'this week': () => {
                const curr = new Date();
                const first = curr.getDate() - curr.getDay();
                const last = first + 6;
                return { createdAt: { [Op.between]: [startOfDay(new Date(curr.setDate(first))), endOfDay(new Date(curr.setDate(last)))] } };
            },
            'last week': () => {
                const curr = new Date();
                const first = curr.getDate() - curr.getDay() - 7;
                const last = first + 6;
                return { createdAt: { [Op.between]: [startOfDay(new Date(curr.setDate(first))), endOfDay(new Date(curr.setDate(last)))] } };
            },
            'this month': () => {
                const start = new Date(now.getFullYear(), now.getMonth(), 1);
                const end = endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));
                return { createdAt: { [Op.between]: [start, end] } };
            },
            'last month': () => {
                const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const end = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));
                return { createdAt: { [Op.between]: [start, end] } };
            },
            'this year': () => {
                const start = new Date(now.getFullYear(), 0, 1);
                const end = endOfDay(new Date(now.getFullYear(), 11, 31));
                return { createdAt: { [Op.between]: [start, end] } };
            },
            'last year': () => {
                const start = new Date(now.getFullYear() - 1, 0, 1);
                const end = endOfDay(new Date(now.getFullYear() - 1, 11, 31));
                return { createdAt: { [Op.between]: [start, end] } };
            },
        };

        let dataset;
        let isFollowUp = false;
        const lastHist = global.adminHistory.get(userId)?.slice(-1)[0];
        if (lastHist && detectFollowUp(question, lastHist.question)) {
            dataset = lastHist.dataset;
            isFollowUp = true;
        }
        if (!dataset) {
            let dateFilter = {};
            for (const key in timeMap) {
                if (new RegExp(key, 'i').test(question)) {
                    dateFilter = timeMap[key]();
                    break;
                }
            }

            let tenantFilter = {};
            const uuidMatch = question.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
            if (uuidMatch) {
                tenantFilter.id = uuidMatch[0];
            } else {
                const nameHint = /tenant\s+([a-z0-9 \-_'&.]+)/i.exec(question);
                if (nameHint && nameHint[1]) {
                    const like = `%${nameHint[1].trim()}%`;
                    const match = await db.Tenant.findOne({
                        where: { companyName: { [Op.iLike || Op.like]: like } },
                        attributes: ['id', 'companyName'],
                    }).catch(() => null);
                    if (match) tenantFilter.id = match.id;
                }
            }

            const wantsTenants =
                /\b(tenant|tenants|company|companies|business|businesses|vendor|vendors|shop|shops|store|stores|merchant|merchants|gst|gst\s*number|tax\s*id|approval|approved|approvals|rejected|pending|registered|registration)\b/i.test(
                    question
                );

            const wantsUsers =
                /\b(user|users|admin|admins|administrator|administrators|staff|employee|employees|account|accounts|personnel|member|members|operator|operators|role|roles|permission|permissions)\b/i.test(
                    question
                );

            const wantsRoles = /\b(role|roles|job\s*title|job\s*titles|position|positions|designation|designations)\b/i.test(question);

            const wantsPermissions =
                /\b(permission|permissions|access|rights|privilege|privileges|authorization|authorizations|menu\s*right|menu\s*rights|security\s*right|security\s*rights)\b/i.test(
                    question
                );

            const wantsMenuAdmin =
                /\b(menu\s*admin|admin\s*menu|modules|module|sidebar|side\s*bar|navigation|navigations|feature|features|function|functions|screen|screens)\b/i.test(
                    question
                );

            const wantsSettings =
                /\b(setting|settings|config|configs|configuration|configurations|preference|preferences|key\s*value|system\s*setting|system\s*settings|option|options|parameter|parameters)\b/i.test(
                    question
                );

            const wantsActivity =
                /\b(activity|activities|audit|audits|audit\s*log|audit\s*logs|log|logs|history|histories|changed|changes|created|updated|deleted|modification|modifications|track|tracking)\b/i.test(
                    question
                );

            const wantsLogins =
                /\b(login|logins|logout|logouts|session|sessions|device|devices|browser|browsers|ip\s*address|ip\s*addresses|login\s*log|login\s*logs|signin|signins|signout|signouts)\b/i.test(
                    question
                );

            const wantsCustomers =
                /\b(customer|customers|member|members|patron|patrons|buyer|buyers|client|clients|guest|guests|shopper|shoppers)\b/i.test(
                    question
                );

            const wantsPoints =
                /\b(point|points|loyalty|loyalty\s*points|reward|rewards|credit|credits|customer\s*points|redeem|redeemed)\b/i.test(
                    question
                );

            const wantsGeo =
                /\b(city|cities|state|states|country|countries|region|regions|province|provinces|location|locations|geo|geography|geographical)\b/i.test(
                    question
                );

            dataset = {};
            if (wantsTenants) {
                dataset.tenants = await db.Tenant.findAll({
                    where: { ...dateFilter },
                    disableTenantCheck: true,
                    limit: 100,
                    order: [['createdAt', 'DESC']],
                });
            }
            if (wantsUsers) {
                dataset.users = await db.User.findAll({
                    where: { ...dateFilter },
                    limit: 100,
                    order: [['createdAt', 'DESC']],
                });
            }
            if (wantsRoles) dataset.roles = await db.Role.findAll({ where: { ...dateFilter }, limit: 100, disableTenantCheck: true });
            if (wantsPermissions) dataset.permissions = await db.Permission.findAll({ where: { ...dateFilter }, limit: 200 });
            if (wantsMenuAdmin) dataset.menuAdmin = await db.MenuAdmin.findAll({ where: { status: '1' }, limit: 200 });
            if (wantsSettings) dataset.settings = await db.Setting.findAll({ where: { ...dateFilter }, limit: 200 });
            if (wantsActivity) dataset.activityLogs = await db.activityLog.findAll({ where: { ...dateFilter }, limit: 200 });
            if (wantsLogins)
                dataset.logLogins = await db.LogLogin.findAll({ where: { ...dateFilter }, limit: 200, disableTenantCheck: true });
            if (wantsCustomers) dataset.customers = await db.Customer.findAll({ where: { ...dateFilter }, limit: 200 });
            if (wantsPoints) dataset.customerPoints = await db.CustomerPoints.findAll({ limit: 200 });
            if (wantsGeo) {
                const countries = await db.GeoCountry.findAll({ limit: 300 });
                const states = await db.GeoState.findAll({ limit: 1000 });
                const cities = await db.GeoCity.findAll({ limit: 2000 });

                dataset.geo = {
                    countries: countries.map((c) => c.toJSON()),
                    states: states.map((s) => {
                        const country = countries.find((c) => c.id === s.countryId);
                        return {
                            ...s.toJSON(),
                            countryName: country ? country.name : null,
                        };
                    }),
                    cities: cities.map((city) => {
                        const state = states.find((s) => s.id === city.stateId);
                        const country = state ? countries.find((c) => c.id === state.countryId) : null;
                        return {
                            ...city.toJSON(),
                            stateName: state ? state.name : null,
                            countryName: country ? country.name : null,
                        };
                    }),
                };
            }
        }

        const prompt = `
You are a highly accurate and precise admin data analyst. Answer the user's question **only** from the provided dataset JSON.
System Date: ${new Date().toUTCString()}
User Question: "${question}"
Dataset: ${JSON.stringify(dataset, null, 2)}
RULES:
1. Use ONLY the dataset.
2. No guessing or hallucination.
3. Apply exact time filters.
4. Missing/null fields => "Not available".
5. Currency = ₹, IST time format.
6. For multi-tenant results, include tenantId.
7. No match => "No matching records found."
8. Irrelevant => "This question is not answerable from the provided data."
9. Deterministic output.`;

        const answer = mode === 'fast' ? await askGroqFast(prompt) : await askGroqAccurate(prompt);

        const hist = global.adminHistory.get(userId) || [];
        hist.push({ question, dataset, answer, timestamp: new Date() });
        if (hist.length > 5) hist.shift();
        global.adminHistory.set(userId, hist);

        return res.status(status.OK).json({ message: answer, followUp: isFollowUp });
    } catch (err) {
        console.error('askAdminAI Error:', err.message);
        return res.status(status.InternalServerError).json({ message: 'Internal server error' });
    }
};

exports.askCustomerAI = async (req, res) => {
    try {
        const customer = await db.Customer.findOne({ where: { id: req.user.id }, raw: true });
        if (!customer) {
            console.error('askCustomerAI Error: Customer not found for user', req.user.id);
            return res.status(status.Unauthorized).json({ message: 'Unauthorized: customer not found.' });
        }

        const { question, mode } = req.body || {};

        const userId = customer?.id;
        if (!userId) {
            return res.status(status.Unauthorized).json({ message: 'Unauthorized: user not found in token.' });
        }
        if (!question || typeof question !== 'string' || !question.trim()) {
            return res.status(status.BadRequest).json({ message: 'Question is required.' });
        }

        if (!global.customerQuestionHistory) global.customerQuestionHistory = new Map();
        if (!global.customerOrderMemory) global.customerOrderMemory = new Map();
        if (!global.customerBudgetGoals) global.customerBudgetGoals = new Map();

        // --- helpers ---
        const pushHistory = (userId, entry) => {
            const arr = global.customerQuestionHistory.get(userId) || [];
            arr.push({ ...entry, ts: new Date() });
            if (arr.length > 5) arr.shift();
            global.customerQuestionHistory.set(userId, arr);
        };
        const lastHistory = (userId) => {
            const arr = global.customerQuestionHistory.get(userId) || [];
            return arr.length ? arr[arr.length - 1] : null;
        };

        const detectFollowUp = (newQ, lastQ) => {
            const lowerQ = (newQ || '').toLowerCase();
            const vague = [
                'previous',
                'above',
                'those',
                'them',
                'last',
                'again',
                'same',
                'continue',
                'earlier',
                'from before',
                'from previous',
                'from above',
                'that',
            ];
            const hasVague = vague.some((w) => lowerQ.includes(w));
            const shortQ = lowerQ.split(/\s+/).length <= 5;
            const lastWords = (lastQ || '').toLowerCase().split(/\s+/);
            const shared = lastWords.filter((w) => w.length > 3 && lowerQ.includes(w));
            return hasVague || shortQ || shared.length > 3;
        };

        const now = new Date();
        const startOfDay = (d) => new Date(d.setHours(0, 0, 0, 0));
        const endOfDay = (d) => new Date(d.setHours(23, 59, 59, 999));
        const timeMap = {
            today: () => ({ createdAt: { [Op.between]: [startOfDay(new Date()), endOfDay(new Date())] } }),
            yesterday: () => {
                const t = new Date();
                t.setDate(t.getDate() - 1);
                return { createdAt: { [Op.between]: [startOfDay(t), endOfDay(t)] } };
            },
            'this week': () => {
                const c = new Date();
                const first = c.getDate() - c.getDay();
                const last = first + 6;
                return { createdAt: { [Op.between]: [startOfDay(new Date(c.setDate(first))), endOfDay(new Date(c.setDate(last)))] } };
            },
            'last week': () => {
                const c = new Date();
                const first = c.getDate() - c.getDay() - 7;
                const last = first + 6;
                return { createdAt: { [Op.between]: [startOfDay(new Date(c.setDate(first))), endOfDay(new Date(c.setDate(last)))] } };
            },
            'this month': () => {
                const start = new Date(now.getFullYear(), now.getMonth(), 1);
                const end = endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));
                return { createdAt: { [Op.between]: [start, end] } };
            },
            'last month': () => {
                const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const end = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));
                return { createdAt: { [Op.between]: [start, end] } };
            },
            'this year': () => {
                const start = new Date(now.getFullYear(), 0, 1);
                const end = endOfDay(new Date(now.getFullYear(), 11, 31));
                return { createdAt: { [Op.between]: [start, end] } };
            },
            'last year': () => {
                const start = new Date(now.getFullYear() - 1, 0, 1);
                const end = endOfDay(new Date(now.getFullYear() - 1, 11, 31));
                return { createdAt: { [Op.between]: [start, end] } };
            },
        };

        // --- intent detection (customer-centric) ---
        const q = question.toLowerCase();

        const wantsOrders =
            /\b(order|orders|spend|amount|bill|invoice|payment|paid|unpaid|status|parcel|delivery|purchase|transaction|receipt|history|record|track|tracking)\b/.test(
                q
            );

        const wantsPoints = /\b(point|points|loyalty|reward|rewards|stars|credits|miles|score|ranking|cashback|bonus)\b/.test(q);

        const wantsCoupons =
            /\b(coupon|coupons|discount|offer|voucher|code|promo|promotion|deal|sale|giftcard|gift\s*card|cashback|token)\b/.test(q);

        const wantsFavorites =
            /\b(favorite|favourite|top|most\s*ordered|frequent|often|usually|common|popular|regular|habitual|preferred|liked)\b/.test(q);

        const wantsTenants =
            /\b(tenant|restaurant|shop|store|merchant|company|brand|outlet|seller|vendor|provider|supplier|canteen|eatery)\b/.test(q);

        const wantsRepeat =
            /\b(repeat|same\s*as\s*last|order\s*again|reorder|again|duplicate|copy\s*order|one\s*more\s*time|repeat\s*order)\b/.test(q);

        const wantsBudget =
            /\b(budget|limit|monthly\s*limit|cap|spend\s*limit|max\s*spend|spending\s*goal|allowance|target|threshold|restriction)\b/.test(
                q
            );

        const wantsCompare =
            /\b(compare|vs|versus|more\s*than|less\s*than|increase|decrease|trend|growth|decline|difference|variation|contrast|analysis)\b/.test(
                q
            );

        // time filter
        let dateFilter = {};
        for (const k in timeMap) {
            if (new RegExp(`\\b${k}\\b`, 'i').test(question)) {
                dateFilter = timeMap[k]();
                break;
            }
        }

        // --- budget goal setter (simple parse like "set my monthly budget to 3000" or "₹2500") ---
        if (wantsBudget && /\b(set|update|change)\b/.test(q)) {
            const numMatch = question.replace(/[,₹]/g, '').match(/(\d{3,})/);
            if (numMatch) {
                const amt = Number(numMatch[1]);
                const goal = global.customerBudgetGoals.get(userId) || {};
                goal.monthlyLimit = amt;
                global.customerBudgetGoals.set(userId, goal);
            }
        }

        // --- dataset fetcher (only for this user) ---
        const buildDataset = async () => {
            const promises = [];

            // Always fetch minimal profile & points if asked or helpful
            if (wantsPoints || /\b(profile|me|my\s*account)\b/.test(q)) {
                promises.push(
                    db.Customer.findOne({
                        where: { id: userId },
                        attributes: ['id', 'firstName', 'lastName', 'phoneNo', 'email', 'gender', 'address', 'createdAt'],
                    })
                );
                promises.push(
                    db.CustomerPoints.findOne({
                        where: { customerId: userId },
                        attributes: ['customerId', 'totalPoints', 'currentOrderCount', 'bonusPosition', 'updatedAt'],
                    })
                );
            }

            if (wantsCoupons) {
                promises.push(
                    db.DiscountCouponUser.findAll({
                        where: { customerId: userId },
                        include: [
                            {
                                model: db.DiscountCoupon,
                                as: 'DiscountCoupon',
                                attributes: [
                                    'id',
                                    'tenantId',
                                    'code',
                                    'type',
                                    'value',
                                    'maxUsage',
                                    'minOrderAmount',
                                    'isPublic',
                                    'isActive',
                                    'validFrom',
                                    'validTo',
                                    'description',
                                ],
                                disableTenantCheck: true,
                            },
                        ],
                        limit: 100,
                    })
                );
            }

            if (wantsOrders || wantsFavorites || wantsTenants || wantsRepeat || wantsCompare || Object.keys(dateFilter).length) {
                promises.push(
                    db.OrderList.findAll({
                        where: { customerId: userId, ...dateFilter },
                        order: [['createdAt', 'DESC']],
                        limit: 100,
                        include: [
                            {
                                model: db.OrderItem,
                                as: 'OrderItem',
                                required: false,
                                on: {
                                    col1: sequelize.where(sequelize.col('OrderList.id'), '=', sequelize.col('OrderItem.orderListId')),
                                },
                                attributes: ['menuId', 'comboId', 'quantity', 'totalPrice', 'createdAt'],
                                include: [
                                    {
                                        model: db.Menu,
                                        as: 'Menu',
                                        required: false,
                                        foreignKey: 'menuId',
                                        targetKey: 'id',
                                        attributes: ['id', 'name', 'price', 'tenantId'],
                                        disableTenantCheck: true,
                                    },
                                    {
                                        model: db.ComboGroup,
                                        as: 'ComboGroup',
                                        attributes: ['id', 'name', 'price'],
                                        include: [
                                            {
                                                model: db.ComboGroupItem,
                                                as: 'ComboGroupItems',
                                                attributes: ['id', 'menuId', 'quantity', 'type'],
                                                disableTenantCheck: true,
                                            },
                                        ],
                                        disableTenantCheck: true,
                                    },
                                ],
                            },
                            {
                                model: db.OrderBill,
                                as: 'OrderBill',
                                attributes: [
                                    'id',
                                    'totalAmount',
                                    'discountAmount',
                                    'couponCode',
                                    'finalAmount',
                                    'pointsUsed',
                                    'status',
                                    'createdAt',
                                ],
                                required: false,
                                include: [
                                    {
                                        model: db.OrderPayment,
                                        as: 'OrderPayment',
                                        attributes: ['id', 'cash', 'card', 'online', 'amountPaid', 'status', 'createdAt'],
                                        required: false,
                                    },
                                ],
                            },
                        ],
                        disableTenantCheck: true,
                        raw: false,
                        nest: true,
                    })
                );
            }

            const results = await Promise.all(promises);

            let profile = null;
            let points = null;
            let couponUsersOrUndefined = [];
            let ordersOrUndefined = [];

            if (wantsPoints) {
                profile = results.shift() || null;
                points = results.shift() || null;
            }

            if (wantsCoupons) {
                couponUsersOrUndefined = results.shift() || [];
            }

            if (wantsOrders || wantsFavorites || wantsTenants || wantsRepeat || wantsCompare || Object.keys(dateFilter).length) {
                ordersOrUndefined = results.shift() || [];
            }

            const orders = Array.isArray(ordersOrUndefined) ? ordersOrUndefined : [];

            let tenantMap = {};
            if (orders.length) {
                const tenantIds = [...new Set(orders.map((o) => o.tenantId).filter(Boolean))];
                if (tenantIds.length) {
                    const tenants = await db.Tenant.findAll({ where: { id: { [Op.in]: tenantIds } }, attributes: ['id', 'companyName'] });
                    tenantMap = tenants.reduce((acc, t) => {
                        acc[t.id] = t.companyName;
                        return acc;
                    }, {});
                }
            }

            if (orders.length) {
                const memory = orders.slice(0, 5).map((o) => ({
                    orderId: o.id,
                    snapshot: {
                        id: o.id,
                        tenantId: o.tenantId,
                        tenantName: tenantMap[o.tenantId] || null,
                        items: (o.OrderItem || []).map((it) => ({
                            quantity: it.quantity,
                            menu: it.Menu ? { id: it.Menu.id, name: it.Menu.name, price: it.Menu.price } : null,
                            combo: it.ComboGroup ? { id: it.ComboGroup.id, name: it.ComboGroup.name, price: it.ComboGroup.price } : null,
                        })),
                        bill: o.OrderBill?.[0]
                            ? {
                                  id: o.OrderBill[0].id,
                                  totalAmount: o.OrderBill[0].totalAmount,
                                  finalAmount: o.OrderBill[0].finalAmount,
                                  status: o.OrderBill[0].status,
                              }
                            : null,
                        createdAt: o.createdAt,
                    },
                }));
                global.customerOrderMemory.set(userId, memory);
            }

            // Format dataset for LLM
            const formattedOrders = orders.map((o) => {
                const bill = o.OrderBill?.[0] || null;
                const payment = bill?.OrderPayment?.[0] || null;
                return {
                    id: o.id,
                    tenantId: o.tenantId,
                    tenantName: tenantMap[o.tenantId] || null,
                    placedBy: o.placedBy === '1' ? 'Customer' : 'Tenant',
                    status: o.status === '1' ? 'Pending' : o.status === '2' ? 'Confirmed' : o.status === '3' ? 'Cancelled' : 'Unknown',
                    isParcel: o.isParcel === '1' ? true : false,
                    cancelReason: o.cancelReason || null,
                    cancelledBy: o.cancelledBy === '0' ? 'Customer' : o.cancelledBy === '1' ? 'Tenant' : null,
                    createdAt: o.createdAt,
                    items: (o.OrderItem || []).map((it) => ({
                        quantity: it.quantity,
                        totalPrice: it.totalPrice,
                        menu: it.Menu ? { id: it.Menu.id, name: it.Menu.name, price: it.Menu.price, tenantId: it.Menu.tenantId } : null,
                        combo: it.ComboGroup ? { id: it.ComboGroup.id, name: it.ComboGroup.name, price: it.ComboGroup.price } : null,
                    })),
                    bill: bill
                        ? {
                              id: bill.id,
                              totalAmount: bill.totalAmount,
                              discountAmount: bill.discountAmount,
                              couponCode: bill.couponCode,
                              finalAmount: bill.finalAmount,
                              pointsUsed: bill.pointsUsed,
                              status:
                                  bill.status === '1'
                                      ? 'Paid'
                                      : bill.status === '0'
                                        ? 'Unpaid'
                                        : bill.status === '2'
                                          ? 'Cancelled'
                                          : 'Unknown',
                              packingFee: bill.packingFee,
                              gstPercent: bill.gstPercent,
                              createdAt: bill.createdAt,
                          }
                        : null,
                    payment: payment
                        ? {
                              id: payment.id,
                              cash: payment.cash,
                              card: payment.card,
                              online: payment.online,
                              amountPaid: payment.amountPaid,
                              status: payment.status === 'paid' ? 'Paid' : 'Failed',
                              createdAt: payment.createdAt,
                          }
                        : null,
                };
            });

            const coupons = Array.isArray(couponUsersOrUndefined)
                ? couponUsersOrUndefined.map((cu) => ({
                      id: cu.id,
                      usedCount: cu.usedCount,
                      coupon: cu.DiscountCoupon
                          ? {
                                id: cu.DiscountCoupon.id,
                                tenantId: cu.DiscountCoupon.tenantId,
                                code: cu.DiscountCoupon.code,
                                type: cu.DiscountCoupon.type,
                                value: cu.DiscountCoupon.value,
                                maxUsage: cu.DiscountCoupon.maxUsage,
                                minOrderAmount: cu.DiscountCoupon.minOrderAmount,
                                isPublic: cu.DiscountCoupon.isPublic,
                                isActive: cu.DiscountCoupon.isActive,
                                validFrom: cu.DiscountCoupon.validFrom,
                                validTo: cu.DiscountCoupon.validTo,
                                description: cu.DiscountCoupon.description,
                            }
                          : null,
                  }))
                : [];

            return {
                profile: profile
                    ? {
                          id: profile.id,
                          name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
                          phone: profile.phoneNo,
                          email: profile.email,
                          gender: profile.gender,
                          address: profile.address,
                          joinedAt: profile.createdAt,
                      }
                    : null,
                points: points
                    ? {
                          totalPoints: points.totalPoints,
                          currentOrderCount: points.currentOrderCount,
                          bonusPosition: points.bonusPosition,
                          updatedAt: points.updatedAt,
                      }
                    : null,
                budgetGoal: global.customerBudgetGoals.get(userId) || null,
                coupons,
                orders: formattedOrders,
            };
        };

        // Use last dataset on follow-up if appropriate
        let dataset;
        let isFollowUp = false;
        const last = lastHistory(userId);
        if (last && detectFollowUp(question, last.q)) {
            dataset = last.dataset;
            isFollowUp = true;
        }
        if (!dataset) {
            dataset = await buildDataset();
        }

        // LLM prompt (customer-focused)
        const prompt = `
You are a precise personal ordering assistant for a single customer.

SYSTEM DATE (UTC): ${new Date().toUTCString()}
USER QUESTION: "${question}"

DATASET (JSON):
${JSON.stringify({ ...dataset }, null, 2)}

STRICT RULES:
1) Use ONLY the provided dataset. Do NOT guess or invent.
2) If time filters like "today/last month" are present, filter by "createdAt" strictly.
3) Missing/null -> respond "Not available".
4) Currency: use ₹. Times should be in IST format (YYYY-MM-DD hh:mm A IST).
5) If the question cannot be answered from the dataset -> "This question is not answerable from the provided data."
6) If no matching results after filters -> "No matching orders found."
7) Distinguish coupon codes from combo names. If asked for coupons, use coupon.code only.
8) Provide short, structured outputs (bullets or compact tables).
9) Personal insights allowed ONLY if supported by dataset (e.g., total spend, average order value, favorite items from frequency).
10) If actionHints.canRepeat is true and the user asked to repeat an order, describe the last order snapshot for confirmation text (DO NOT fabricate placement).
11) Be deterministic: same data + question => same answer.
`;

        const answer = mode === 'Think hard with accurate' ? await askGroqFast(prompt) : await askGroqAccurate(prompt);

        // Save question history
        pushHistory(userId, { q: question, dataset, answer });

        return res.status(status.OK).json({ message: answer, followUp: isFollowUp });
    } catch (err) {
        console.error('askCustomerAI Error:', err.message);
        return res.status(status.InternalServerError).json({ message: 'Internal server error' });
    }
};

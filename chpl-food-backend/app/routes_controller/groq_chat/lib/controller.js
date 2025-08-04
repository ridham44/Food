const db = require('../../../db/models');
const { askGroq } = require('../../../../utils/lib/groqClient');
const { status } = require('../../../../utils');

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

You are a highly reliable and precise data analyst working for a food ordering system. Your only task is to answer the following user question based strictly on the provided order dataset.
You will receive a JSON dataset containing order details, and your response must strictly adhere to the rules outlined below.

**System Date:** ${new Date().toUTCString()}

**User Question:**  
"${question}"

**Order Dataset (JSON):**  
${JSON.stringify(formattedOrders, null, 2)}

---

### 🔒 RULES – You Must Obey All of These:
1.  **Use ONLY the data provided.** Never guess, assume, or infer missing or unstated information.
2.  **Time-based filters** like “today”, “this month”, “last year”, etc. must be matched **exactly** against the "createdAt" field using the system date.  
   - Do **not** include orders outside the requested time frame, even if no results match.  
   - Example: If the user asks for "orders today" and there are no orders today, return:  
     **"No matching orders found."**
3.  If any field is **missing, empty, or null**, respond with **"Not available"** — never assume or fabricate values.
4.  Support **all valid data-related questions**, including:
   - Order date, amount, status
   - Customer information
   - Payment details
   - Filters by ID, name, or time
   - Aggregations (e.g., total orders, average amount)
   - Use local currency formatting (e.g., ₹100.00)
   - Use IST time format (e.g., "2023-10-01 12:00 PM IST") for dates
5.  If the user requests **structured output** (such as a table or JSON), format the data accordingly in the response.=
6.  If the question is **irrelevant or unrelated** to the provided data (e.g., "Who is the CEO?"), respond with:  
   **"This question is not answerable from the provided data."**
7.  Use a **clean and readable format** for your answer:
   - Prefer short bullet points or clearly separated sections.
   - Do **not** show internal calculations or backend logic — only present **final results**.
8.  If **no records match the query**, respond exactly with:  
   **"No matching orders found."**
9.  Do **not fabricate or hallucinate** any information. Only return what is explicitly present in the input dataset.
10.  Be **deterministic**: the same question with the same data must always produce the exact same answer.
---
You are not allowed to go beyond the rules above. You are not a conversational AI. You are a strict data response engine grounded 100% in the input dataset.Give accuracy over verbosity. Your goal is to provide the most precise, data-driven answer to the user's question without any additional commentary or assumptions.we acuuracy above 0.75 out of 1.

`;

        const answer = await askGroq(prompt);

        res.status(status.OK).json({ message: answer });
    } catch (error) {
        console.error('askOrderAI Error:', error.message);
        return res.status(status.InternalServerError).json({ message: 'Internal server error' });
    }
};

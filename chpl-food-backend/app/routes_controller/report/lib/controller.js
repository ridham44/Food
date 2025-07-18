const { Op, fn, col } = require('sequelize');
const { status, common } = require('../../../../utils');
const db = require('../../../db/models');

const parseDate = (input) => {
    const parts = input.split('/');
    if (parts.length === 3) return new Date(`${parts[0]}-${parts[1]}-${parts[2]}T00:00:00`);
    if (parts.length === 2) return new Date(`${parts[0]}-${parts[1]}-01T00:00:00`);
    if (parts.length === 1) return new Date(`${parts[0]}-01-01T00:00:00`);
    return null;
};

exports.orderSummary = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        const user = req.user;

        if (!user.tenantId) {
            return res.status(status.Forbidden).json({ message: 'Tenant access only' });
        }

        const tenantId = user.tenantId;

        let start = startDate ? parseDate(startDate) : null;
        let end = null;

        if (endDate) {
            const parts = endDate.split('/');
            if (parts.length === 3) {
                end = new Date(`${parts[0]}-${parts[1]}-${parts[2]}T23:59:59`);
            } else if (parts.length === 2) {
                const year = parseInt(parts[0]);
                const month = parseInt(parts[1]);
                end = new Date(year, month, 0, 23, 59, 59);
            } else if (parts.length === 1) {
                end = new Date(`${parts[0]}-12-31T23:59:59`);
            }
        }

        const whereClause = {
            '$OrderList.tenantId$': tenantId,
        };

        if (start && end) {
            whereClause.createdAt = { [Op.between]: [start, end] };
        } else if (start) {
            whereClause.createdAt = { [Op.gte]: start };
        } else if (end) {
            whereClause.createdAt = { [Op.lte]: end };
        }

        const totalOrders = await db.OrderList.count({
            where: { tenantId, ...(whereClause.createdAt ? { createdAt: whereClause.createdAt } : {}) },
        });

        const totalProfit = await db.OrderBill.sum('totalAmount', {
            include: [
                {
                    model: db.OrderList,
                    as: 'OrderList',
                    where: { tenantId },
                    attributes: [],
                },
            ],
            where: whereClause,
        });

        const customerSummary = await db.OrderBill.findAll({
            attributes: [
                'OrderList.customerId',
                [fn('COUNT', col('OrderBill.id')), 'orderCount'],
                [fn('SUM', col('OrderBill.finalAmount')), 'totalSpent'],
                [fn('CONCAT', col('OrderList->Customer.firstName'), ' ', col('OrderList->Customer.lastName')), 'name'],
                [col('OrderList->Customer.phoneNo'), 'mobile'],
            ],
            include: [
                {
                    model: db.OrderList,
                    as: 'OrderList',
                    attributes: [],
                    where: { tenantId },
                    include: [
                        {
                            model: db.Customer,
                            as: 'Customer',
                            attributes: [],
                        },
                    ],
                },
            ],
            where: whereClause,
            group: ['OrderList.customerId', 'OrderList->Customer.firstName', 'OrderList->Customer.lastName', 'OrderList->Customer.phoneNo'],
            raw: true,
        });

        return res.status(status.OK).json({
            message: 'Order summary report generated',
            data: {
                totalOrders,
                totalProfit: parseFloat(totalProfit || 0).toFixed(2),
                customerSummary,
            },
        });
    } catch (error) {
        return common.throwException(error, 'Generate Order Summary Report', req, res);
    }
};

exports.mostSoldItems = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        const user = req.user;

        if (!user.tenantId) {
            return res.status(status.Forbidden).json({ message: 'Tenant access only' });
        }

        const tenantId = user.tenantId;
        let start = null;
        let end = null;

        if (startDate) {
            const parts = startDate.split('/');
            if (parts.length === 3) start = new Date(`${parts[0]}-${parts[1]}-${parts[2]}T00:00:00`);
            else if (parts.length === 2) start = new Date(`${parts[0]}-${parts[1]}-01T00:00:00`);
            else if (parts.length === 1) start = new Date(`${parts[0]}-01-01T00:00:00`);
        }
        if (endDate) {
            const parts = endDate.split('/');
            if (parts.length === 3) end = new Date(`${parts[0]}-${parts[1]}-${parts[2]}T23:59:59`);
            else if (parts.length === 2) end = new Date(parseInt(parts[0]), parseInt(parts[1]), 0, 23, 59, 59);
            else if (parts.length === 1) end = new Date(parseInt(parts[0]), 11, 31, 23, 59, 59);
        }

        const orderWhere = {
            tenantId,
            status: 2,
        };
        if (start && end) orderWhere.createdAt = { [Op.between]: [start, end] };
        else if (start) orderWhere.createdAt = { [Op.gte]: start };
        else if (end) orderWhere.createdAt = { [Op.lte]: end };

        const menuItems = await db.OrderItem.findAll({
            attributes: [
                'menuId',
                [fn('SUM', col('OrderItem.quantity')), 'quantity'],
                [fn('SUM', col('OrderItem.totalPrice')), 'totalRevenue'],
                [fn('COUNT', fn('DISTINCT', col('OrderItem.orderListId'))), 'ordersCount'],
                [fn('MAX', col('OrderItem.createdAt')), 'lastOrdered'],
                [col('Menu.name'), 'itemName'],
                [col('Menu.price'), 'pricePerUnit'],
            ],
            include: [
                {
                    model: db.Menu,
                    as: 'Menu',
                    attributes: [],
                    required: true,
                },
                {
                    model: db.OrderList,
                    as: 'OrderList',
                    attributes: [],
                    where: orderWhere,
                    required: true,
                },
            ],
            where: {
                comboId: null,
                menuId: { [Op.ne]: null },
            },
            group: ['menuId', 'Menu.name', 'Menu.price'],
            raw: true,
        });

        const menuFormatted = menuItems.map((item) => ({
            ...item,
            type: 'menu',
        }));

        const comboItems = await db.OrderItem.findAll({
            attributes: [
                'comboId',
                [fn('SUM', col('OrderItem.quantity')), 'quantity'],
                [fn('SUM', col('OrderItem.totalPrice')), 'totalRevenue'],
                [fn('COUNT', fn('DISTINCT', col('OrderItem.orderListId'))), 'ordersCount'],
                [fn('MAX', col('OrderItem.createdAt')), 'lastOrdered'],
                [col('ComboGroup.name'), 'itemName'],
                [col('ComboGroup.price'), 'pricePerUnit'],
            ],
            include: [
                {
                    model: db.ComboGroup,
                    as: 'ComboGroup',
                    attributes: [],
                    required: true,
                },
                {
                    model: db.OrderList,
                    as: 'OrderList',
                    attributes: [],
                    where: orderWhere,
                    required: true,
                },
            ],
            where: {
                menuId: null,
                comboId: { [Op.ne]: null },
            },
            group: ['comboId', 'ComboGroup.name', 'ComboGroup.price'],
            raw: true,
        });

        const comboFormatted = comboItems.map((item) => ({
            ...item,
            type: 'combo',
        }));

        const allItems = [...menuFormatted, ...comboFormatted];
        allItems.sort((a, b) => b.quantity - a.quantity);

        return res.status(status.OK).json({
            message: 'Most sold items report generated',
            data: allItems,
        });
    } catch (error) {
        return common.throwException(error, 'Generate Most Sold Items Report', req, res);
    }
};

exports.comboOrdersReport = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        if (!tenantId) {
            return res.status(status.Forbidden).json({ message: 'Tenant access only' });
        }

        const orderItems = await db.OrderItem.findAll({
            include: [
                {
                    model: db.OrderList,
                    as: 'OrderList',
                    where: { tenantId },
                    attributes: ['id'],
                },
                {
                    model: db.Menu,
                    as: 'Menu',
                    attributes: ['name'],
                    disableTenantCheck: true,
                },
            ],
            raw: true,
        });

        const orderGroups = {};

        for (const item of orderItems) {
            const groupId = item['OrderList.id'];
            const itemName = item['Menu.name']?.trim();

            if (itemName) {
                if (!orderGroups[groupId]) {
                    orderGroups[groupId] = new Set();
                }
                orderGroups[groupId].add(itemName);
            }
        }

        const comboMap = {};

        for (const itemSet of Object.values(orderGroups)) {
            const items = Array.from(itemSet).sort();

            if (items.length < 2) continue;

            for (let i = 0; i < items.length; i++) {
                for (let j = i + 1; j < items.length; j++) {
                    const comboKey = `${items[i]} + ${items[j]}`;
                    comboMap[comboKey] = (comboMap[comboKey] || 0) + 1;
                }
            }
        }

        const result = Object.entries(comboMap)
            .map(([combo, count]) => ({
                combo: combo.split(' + '),
                count,
            }))
            .sort((a, b) => b.count - a.count);

        return res.status(status.OK).json({
            message: 'Combo Orders Report Generated',
            data: result,
        });
    } catch (error) {
        return common.throwException(error, 'Combo Orders Report', req, res);
    }
};

exports.bookingCategoryReport = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        if (!tenantId) {
            return res.status(status.Forbidden).json({ message: 'Tenant access only' });
        }

        const allOrders = await db.OrderBill.findAll({
            include: [
                {
                    model: db.OrderList,
                    as: 'OrderList',
                    where: { tenantId },
                    attributes: ['customerId', 'placedBy'],
                    include: [
                        {
                            model: db.Customer,
                            as: 'Customer',
                            attributes: ['firstName', 'lastName', 'phoneNo'],
                        },
                    ],
                },
            ],
            attributes: ['id'],
            raw: true,
        });

        const throughApp = {};
        const throughTenant = {};

        for (const order of allOrders) {
            const placedBy = parseInt(order['OrderList.placedBy']);
            const firstName = order['OrderList.Customer.firstName'] || '';
            const lastName = order['OrderList.Customer.lastName'] || '';
            const mobile = order['OrderList.Customer.phoneNo'] || 'N/A';
            const fullName = `${firstName} ${lastName}`.trim();

            const key = `${fullName}-${mobile}`;

            const target = placedBy === 1 ? throughApp : throughTenant;

            if (!target[key]) {
                target[key] = {
                    name: fullName || 'Unknown',
                    mobile,
                    orders: 0,
                };
            }

            target[key].orders += 1;
        }

        return res.status(status.OK).json({
            message: 'Booking category report generated',
            data: {
                throughApp: Object.values(throughApp),
                throughTenant: Object.values(throughTenant),
                totalAppOrders: Object.keys(throughApp).length,
                totalTenantOrders: Object.keys(throughTenant).length,
            },
        });
    } catch (error) {
        return common.throwException(error, 'Booking Category Report', req, res);
    }
};

exports.getUnpaidOrders = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;

        if (!tenantId) {
            return res.status(status.Forbidden).json({ message: 'Tenant access only' });
        }

        const unpaidOrders = await db.OrderList.findAll({
            where: {
                tenantId,
                status: 1,
            },
            include: [
                {
                    model: db.Customer,
                    as: 'Customer',
                    attributes: ['firstName', 'lastName', 'phoneNo'],
                },
                {
                    model: db.OrderItem,
                    as: 'OrderItem',
                    include: [
                        {
                            model: db.Menu,
                            as: 'Menu',
                            attributes: ['name', 'price'],
                            disableTenantCheck: true,
                        },
                    ],
                },
            ],
            order: [['createdAt', 'DESC']],
        });

        const result = unpaidOrders.map((order) => {
            const customer = order.Customer;
            const customerName = `${customer?.firstName || ''} ${customer?.lastName || ''}`.trim();
            const items = order.OrderItems.map((item) => ({
                menuName: item.Menu?.name || '',
                unitPrice: item.Menu?.price || 0,
                quantity: item.quantity,
                totalPrice: item.totalPrice,
            }));

            return {
                orderId: order.id,
                customerName,
                customerMobile: customer?.phoneNo || '',
                createdAt: order.createdAt,
                items,
            };
        });

        return res.status(status.OK).json({
            message: 'Unpaid orders fetched successfully',
            total: result.length,
            orders: result,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            message: 'Failed to fetch unpaid orders',
            error: error.message,
        });
    }
};

exports.getFullOrderDetails = async (req, res) => {
    try {
        const { orderListId } = req.body;

        const order = await db.OrderList.findOne({
            where: { id: orderListId },
            include: [
                {
                    model: db.Customer,
                    as: 'Customer',
                    attributes: ['firstName', 'lastName', 'phoneNo'],
                    required: false,
                },
                {
                    model: db.OrderItem,
                    as: 'OrderItem',
                    include: [
                        {
                            model: db.Menu,
                            as: 'Menu',
                            attributes: ['name', 'price'],
                            disableTenantCheck: true,
                        },
                        {
                            model: db.ComboGroup,
                            as: 'ComboGroup',
                            attributes: ['name', 'price'],
                            disableTenantCheck: true,
                        },
                    ],
                },
                {
                    model: db.OrderBill,
                    as: 'OrderBill',
                },
            ],
        });

        if (!order) {
            return res.status(status.NotFound).json({ message: 'Order not found' });
        }

        const customerName = order.Customer ? `${order.Customer.firstName} ${order.Customer.lastName}`.trim() : order.customerName || 'N/A';

        const customerMobile = order.Customer ? order.Customer.phoneNo : order.customerMobile || 'N/A';

        const orderData = {
            customerName,
            customerMobile,
            placedBy: order.placedBy,
            createdAt: order.createdAt,
            items: Array.isArray(order.OrderItem)
                ? order.OrderItem.map((i) => {
                      if (i.comboId && i.ComboGroup && i.ComboGroup.name) {
                          return {
                              type: 'combo',
                              comboName: i.ComboGroup.name,
                              comboPrice: parseFloat(i.ComboGroup.price),
                              quantity: i.quantity,
                              totalPrice: parseFloat(i.totalPrice),
                          };
                      } else {
                          return {
                              type: 'menu',
                              menuName: i.Menu?.name || 'Unknown',
                              menuPrice: parseFloat(i.Menu?.price || 0),
                              quantity: i.quantity,
                              totalPrice: parseFloat(i.totalPrice),
                          };
                      }
                  })
                : [],
        };

        if (order.status === '2' && Array.isArray(order.OrderBill) && order.OrderBill.length > 0) {
            const bill = order.OrderBill[0];

            const billData = {
                totalAmount: bill.totalAmount ? parseFloat(bill.totalAmount) : 0,
                paymentStatus: bill.status === '1' ? 'paid' : 'unpaid',
                Coupon: bill.couponCode || 'N/A',
                discount: bill.discountAmount ? parseFloat(bill.discountAmount) : 0,
                finalAmount: bill.finalAmount ? parseFloat(bill.finalAmount) : 0,
                createdAt: bill.createdAt,
            };

            if (bill.status === '1') {
                const payments = await db.OrderPayment.findAll({
                    where: { orderBillId: bill.id },
                    raw: true,
                });

                if (payments.length > 0) {
                    billData.payments = payments.map((payment) => ({
                        cash: parseFloat(payment.cash || 0),
                        card: parseFloat(payment.card || 0),
                        online: parseFloat(payment.online || 0),
                        amountPaid: parseFloat(payment.amountPaid || 0),
                        createdAt: payment.createdAt,
                    }));
                }
            }

            orderData.bill = billData;
        }

        return res.status(status.OK).json({
            message: 'Order details fetched successfully',
            order: orderData,
        });
    } catch (error) {
        return common.throwException(error, 'Get Full Order Details', req, res);
    }
};
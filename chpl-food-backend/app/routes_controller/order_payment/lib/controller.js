const db = require('../../../db/models');
const { status, common } = require('../../../../utils');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

exports.getUnpaidBillsByCustomer = async (req, res) => {
    try {
        const { mobile } = req.body;
        const tenantId = req.user.tenantId;

        if (!mobile) {
            return res.status(status.BadRequest).json({ message: 'Customer mobile number is required' });
        }

        const customer = await db.Customer.findOne({ where: { phoneNo: mobile } });
        if (!customer) {
            return res.status(status.NotFound).json({ message: 'Customer not found' });
        }

        const orderLists = await db.OrderList.findAll({
            where: {
                customerId: customer.id,
                tenantId,
            },
            attributes: ['id'],
        });

        const orderListIds = orderLists.map((o) => o.id);

        if (orderListIds.length === 0) {
            return res.status(status.OK).json({
                message: 'No orders found for customer under this tenant',
                total: 0,
                bills: [],
            });
        }

        const unpaidBills = await db.OrderBill.findAll({
            where: {
                orderListId: orderListIds,
                status: '0',
            },
            order: [['createdAt', 'DESC']],
            raw: true,
        });

        const isFirstOrder = orderListIds.length === 1;
        let tenantFirstTimeCoupon = null;
        if (isFirstOrder) {
            tenantFirstTimeCoupon = await db.DiscountCoupon.findOne({
                where: {
                    tenantId,
                    code: 'FIRST',
                    validFrom: { [Op.lte]: new Date() },
                    validTo: { [Op.gte]: new Date() },
                },
                raw: true,
            });
        }

        const billsWithItems = [];
        let couponSuggestion = null;

        for (const bill of unpaidBills) {
            const items = await db.OrderItem.findAll({
                where: { orderListId: bill.orderListId },
                include: [
                    {
                        model: db.Menu,
                        as: 'Menu',
                        attributes: ['name', 'price'],
                        required: false,
                        disableTenantCheck: true,
                    },
                    {
                        model: db.ComboGroup,
                        as: 'ComboGroup',
                        attributes: ['name', 'price'],
                        required: false,
                    },
                ],
                attributes: ['quantity', 'totalPrice', 'menuId', 'comboId'],
                raw: true,
                nest: true,
            });

            const itemDetails = items.map((i) => {
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
            });

            billsWithItems.push({
                id: bill.id,
                totalAmount: parseFloat(bill.totalAmount),
                status: bill.status,
                Coupon: bill.couponCode || null,
                DiscountAmount: parseFloat(bill.discountAmount || 0),
                FinalAmount: parseFloat(bill.finalAmount),
                createdAt: bill.createdAt,
                items: itemDetails,
            });

            if (!couponSuggestion && !bill.couponCode) {
                if (isFirstOrder && tenantFirstTimeCoupon) {
                    couponSuggestion = {
                        code: tenantFirstTimeCoupon.code,
                        description: tenantFirstTimeCoupon.description,
                        canApply: true,
                    };
                }
            }
        }

        return res.status(status.OK).json({
            message: 'Unpaid bills with item details fetched successfully',
            total: billsWithItems.length,
            bills: billsWithItems,
            ...(couponSuggestion && { CouponSuggestion: couponSuggestion }),
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({ message: error.message });
    }
};


exports.makePaymentByBillId = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { billId, cash = 0, card = 0, online = 0 } = req.body;

        if (!billId) {
            return res.status(status.BadRequest).json({ message: 'Bill ID is required' });
        }

        const bill = await db.OrderBill.findOne({ where: { id: billId, status: '0' } });
        if (!bill) {
            return res.status(status.NotFound).json({ message: 'Unpaid bill not found' });
        }

        const totalPaid = parseFloat(cash) + parseFloat(card) + parseFloat(online);

        const payableAmount = bill.finalAmount;

        if (totalPaid < payableAmount) {
            const remaining = (payableAmount - totalPaid).toFixed(2);
            return res.status(status.Conflict).json({
                message: `Insufficient payment. Total bill is ₹${payableAmount}, paid: ₹${totalPaid}, remaining: ₹${remaining}`,
            });
        }

        await db.OrderPayment.create(
            {
                id: uuidv4(),
                orderBillId: bill.id,
                cash,
                card,
                online,
                amountPaid: totalPaid,
                status: 'paid',
                createdAt: new Date(),
            },
            { transaction }
        );

        await db.OrderBill.update({ status: '1' }, { where: { id: bill.id }, transaction });

        await transaction.commit();
        return res.status(status.OK).json({
            message: 'Payment successful. Bill marked as paid.',
            billId: bill.id,
            totalPaid,
        });
    } catch (error) {
        await transaction.rollback();
        return res.status(status.InternalServerError).json({ message: error.message });
    }
};

exports.getPaymentModeReport = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { startDate, endDate } = req.body;

        const orderLists = await db.OrderList.findAll({
            where: { tenantId },
            attributes: ['id'],
            raw: true,
        });
        const orderListIds = orderLists.map((o) => o.id);

        if (!orderListIds.length) {
            return res.status(status.OK).json({
                message: 'No orders found for this tenant',
                data: {},
            });
        }

        const orderBills = await db.OrderBill.findAll({
            where: { orderListId: { [Op.in]: orderListIds } },
            attributes: ['id'],
            raw: true,
        });
        const billIds = orderBills.map((b) => b.id);

        if (!billIds.length) {
            return res.status(status.OK).json({
                message: 'No bills found for this tenant',
                data: {},
            });
        }

        let start = null;
        let end = null;

        const parseDate = (d) => {
            const parts = d.split('/');
            if (parts.length === 3) return new Date(`${parts[0]}-${parts[1]}-${parts[2]}T00:00:00`);
            if (parts.length === 2) return new Date(`${parts[0]}-${parts[1]}-01T00:00:00`);
            if (parts.length === 1) return new Date(`${parts[0]}-01-01T00:00:00`);
            return null;
        };

        if (startDate) start = parseDate(startDate);
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

        const paymentWhere = {
            orderBillId: { [Op.in]: billIds },
        };

        if (start && end) paymentWhere.createdAt = { [Op.between]: [start, end] };
        else if (start) paymentWhere.createdAt = { [Op.gte]: start };
        else if (end) paymentWhere.createdAt = { [Op.lte]: end };

        const payments = await db.OrderPayment.findAll({
            where: paymentWhere,
            order: [['createdAt', 'DESC']],
            raw: true,
        });

        const result = {};

        const addToResult = (key, payment, fields) => {
            if (!result[key]) {
                result[key] = { totalEntries: 0, totalAmount: 0, entries: [] };
            }

            const entry = {
                id: payment.id,
                amountPaid: parseFloat(payment.amountPaid),
                createdAt: payment.createdAt,
            };

            fields.forEach((field) => {
                if (parseFloat(payment[field]) > 0) {
                    entry[field] = parseFloat(payment[field]);
                }
            });

            result[key].entries.push(entry);
            result[key].totalEntries += 1;
            result[key].totalAmount = (parseFloat(result[key].totalAmount) + parseFloat(payment.amountPaid)).toFixed(2);
        };

        for (const payment of payments) {
            const hasCash = parseFloat(payment.cash) > 0;
            const hasCard = parseFloat(payment.card) > 0;
            const hasOnline = parseFloat(payment.online) > 0;

            if (hasCash && !hasCard && !hasOnline) {
                addToResult('cash_only', payment, ['cash']);
            } else if (!hasCash && hasCard && !hasOnline) {
                addToResult('card_only', payment, ['card']);
            } else if (!hasCash && !hasCard && hasOnline) {
                addToResult('online_only', payment, ['online']);
            } else if (hasCash && hasCard && !hasOnline) {
                addToResult('cash_card', payment, ['cash', 'card']);
            } else if (hasCash && !hasCard && hasOnline) {
                addToResult('cash_online', payment, ['cash', 'online']);
            } else if (!hasCash && hasCard && hasOnline) {
                addToResult('card_online', payment, ['card', 'online']);
            } else if (hasCash && hasCard && hasOnline) {
                addToResult('all_modes', payment, ['cash', 'card', 'online']);
            }
        }

        return res.status(status.OK).json({
            message: 'Tenant payment breakdown fetched successfully',
            data: result,
        });
    } catch (error) {
        return common.throwException(error, 'Get Tenant Payment Breakdown', req, res);
    }
};

exports.getPaymentTotals = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { startDate, endDate } = req.body;

        const orderLists = await db.OrderList.findAll({
            where: { tenantId },
            attributes: ['id'],
            raw: true,
        });
        const orderListIds = orderLists.map((o) => o.id);

        if (!orderListIds.length) {
            return res.status(status.OK).json({
                message: 'No orders found for this tenant',
                data: { cash: 0, card: 0, online: 0, totalAmount: 0 },
            });
        }

        const bills = await db.OrderBill.findAll({
            where: { orderListId: { [Op.in]: orderListIds } },
            attributes: ['id'],
            raw: true,
        });
        const billIds = bills.map((b) => b.id);

        if (!billIds.length) {
            return res.status(status.OK).json({
                message: 'No bills found for this tenant',
                data: { cash: 0, card: 0, online: 0, totalAmount: 0 },
            });
        }

        let start = null;
        let end = null;

        const parseDate = (d) => {
            const parts = d.split('/');
            if (parts.length === 3) return new Date(`${parts[0]}-${parts[1]}-${parts[2]}T00:00:00`);
            if (parts.length === 2) return new Date(`${parts[0]}-${parts[1]}-01T00:00:00`);
            if (parts.length === 1) return new Date(`${parts[0]}-01-01T00:00:00`);
            return null;
        };

        if (startDate) start = parseDate(startDate);
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
            orderBillId: { [Op.in]: billIds },
        };

        if (start && end) whereClause.createdAt = { [Op.between]: [start, end] };
        else if (start) whereClause.createdAt = { [Op.gte]: start };
        else if (end) whereClause.createdAt = { [Op.lte]: end };

        const payments = await db.OrderPayment.findAll({
            where: whereClause,
            raw: true,
        });

        let cash = 0;
        let card = 0;
        let online = 0;

        for (const payment of payments) {
            cash += parseFloat(payment.cash || 0);
            card += parseFloat(payment.card || 0);
            online += parseFloat(payment.online || 0);
        }

        const totalAmount = (cash + card + online).toFixed(2);

        return res.status(status.OK).json({
            message: 'Payment mode totals fetched successfully',
            data: {
                cash: cash.toFixed(2),
                card: card.toFixed(2),
                online: online.toFixed(2),
                totalAmount,
            },
        });
    } catch (error) {
        return common.throwException(error, 'Get Simple Payment Totals', req, res);
    }
};

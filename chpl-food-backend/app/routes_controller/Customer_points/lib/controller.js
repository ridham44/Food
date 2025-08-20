const { v4: uuidv4 } = require('uuid');
const db = require('../../../db/models');
const { Op } = require('sequelize');
const { status } = require('../../../../utils');

exports.assignPointsOnOrder = async (orderListId) => {
    try {
        const orderList = await db.OrderList.findOne({ where: { id: orderListId } });
        if (!orderList) {
            return { message: 'OrderList not found' };
        }

        const customerId = orderList.customerId;

        let cp = await db.CustomerPoints.findOne({ where: { customerId } });
        if (!cp) {
            cp = await db.CustomerPoints.create({
                id: uuidv4(),
                customerId,
                totalPoints: 5,
                currentOrderCount: 0,
                bonusPosition: 0,
                createdAt: new Date(),
            });
        } else {
            cp.updatedAt = new Date();
            await cp.save();
        }

        cp.currentOrderCount += 1;

        const bill = await db.OrderBill.findOne({ where: { orderListId } });
        if (!bill) {
            return { message: 'OrderBill not found' };
        }

        const orderAmount = parseFloat(bill.totalAmount);
        let earnedPoints = 0;

        if (cp.currentOrderCount === 1) {
            cp.bonusPosition = Math.floor(Math.random() * 10) + 1;
        }

        if (cp.currentOrderCount === cp.bonusPosition) {
            earnedPoints = orderAmount % 2 === 0 ? 2 : 3;
        }

        cp.totalPoints += earnedPoints;

        if (cp.currentOrderCount === 10) {
            cp.currentOrderCount = 0;
            cp.bonusPosition = 0;
        }

        await cp.save();

        return {
            message: 'Points assigned',
            earnedPoints,
            totalPoints: cp.totalPoints,
        };
    } catch (err) {
        return { message: 'Internal error', error: err.message };
    }
};

exports.testAssignPoints = async (req, res) => {
    const orderListId = 'adcce3b4-d1d3-49d3-8c52-829b30d054e1';

    for (let i = 1; i <= 9; i++) {
        console.log(`\n--- Test Run #${i} ---`);
        const result = await exports.assignPointsOnOrder(orderListId);
        console.log(result);
    }
    return res.status(status.OK).json({
        message: 'successfully',
    });
};

exports.redeemPointsOnly = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { billId, points } = req.body;

        if (!billId || !points || isNaN(points)) {
            await transaction.rollback();
            return res.status(status.BadRequest).json({ message: 'billId and valid points are required' });
        }

        const bill = await db.OrderBill.findOne({
            where: { id: billId, status: '0' },
            transaction,
        });

        if (!bill) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Unpaid bill not found' });
        }

        if (bill.pointsUsed > 0 || bill.couponCode) {
            await transaction.rollback();
            return res.status(status.Conflict).json({ message: 'Discount already applied on this bill' });
        }

        const order = await db.OrderList.findOne({
            where: { id: bill.orderListId },
            transaction,
        });

        if (!order) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Order not found for bill' });
        }

        const { customerId } = order;

        const cp = await db.CustomerPoints.findOne({
            where: { customerId },
            transaction,
        });

        if (!cp || cp.totalPoints < points) {
            await transaction.rollback();
            return res.status(status.Forbidden).json({ message: 'Not enough points to redeem' });
        }

        const totalAmount = parseFloat(bill.totalAmount);
        let discountAmount = parseFloat(points);
        if (discountAmount > totalAmount) discountAmount = totalAmount;

        await db.CustomerPoints.update(
            {
                totalPoints: db.Sequelize.literal(`totalPoints - ${discountAmount}`),
            },
            { where: { customerId }, transaction }
        );

        const finalAmount = (totalAmount - discountAmount).toFixed(2);

        await db.OrderBill.update(
            {
                pointsUsed: discountAmount,
                discountAmount: discountAmount,
                finalAmount: finalAmount,
            },
            { where: { id: billId }, transaction }
        );

        await transaction.commit();
        return res.status(status.OK).json({
            message: `Points redeemed successfully. ₹${discountAmount.toFixed(2)} off.`,
            finalAmount,
        });
    } catch (error) {
        await transaction.rollback();
        return res.status(status.InternalServerError).json({
            message: error.message || 'Failed to redeem points',
        });
    }
};

exports.getPointsBalance = async (req, res) => {
    try {
        const user = req.user;
        let customerId;
        const roleData = await db.Role.findOne({
            where: { id: user.roleId },
            attributes: ['type'],
        });

        if (roleData?.type === '3') {
            customerId = user.id;
        } else if (roleData?.type === '2') {
            const { mobile } = req.body;
            if (!mobile) {
                return res.status(status.BadRequest).json({ message: 'Mobile number is required' });
            }

            const customer = await db.Customer.findOne({ where: { phoneNo: mobile } });

            if (!customer) {
                return res.status(status.NotFound).json({ message: 'Customer not found' });
            }

            customerId = customer.id;
        } else {
            return res.status(status.Forbidden).json({ message: 'Unauthorized role' + user.roleId });
        }

        const pointData = await db.CustomerPoints.findOne({
            where: { customerId },
        });
        const totalPoints = pointData?.totalPoints || 0;

        return res.status(status.OK).json({
            customerId,
            totalPoints,
        });
    } catch (err) {
        console.error(err.message);
        return res.status(status.InternalServerError).json({ message: 'Something went wrong' });
    }
};

exports.getPointsHistory = async (req, res) => {
    try {
        const user = req.user;
        let customerId;

        const role = await db.Role.findByPk(user.roleId, { attributes: ['type'] });

        if (role?.type === '3') {
            customerId = user.id;
        } else if (role?.type === '2') {
            customerId = req.params.customerId;
            if (!customerId) {
                return res.status(status.BadRequest).json({ message: 'Customer ID is required' });
            }
        } else {
            return res.status(status.Forbidden).json({ message: 'Unauthorized role' });
        }

        const orderLists = await db.OrderList.findAll({
            where: { customerId },
            attributes: ['id'],
        });

        const orderListIds = orderLists.map((o) => o.id);

        if (orderListIds.length === 0) {
            return res.status(status.OK).json({ customerId, history: [] });
        }

        const pointBills = await db.OrderBill.findAll({
            where: {
                orderListId: { [Op.in]: orderListIds },
                pointsUsed: { [Op.gt]: 0 },
            },
            attributes: ['id', 'orderListId', 'pointsUsed', 'createdAt'],
            order: [['createdAt', 'DESC']],
        });

        return res.status(status.OK).json({
            customerId,
            history: pointBills,
        });
    } catch (error) {
        console.error(error.message);
        return res.status(status.InternalServerError).json({ message: 'Something went wrong' });
    }
};

exports.topPointHolders = async (req, res) => {
    try {
        const user = req.user;

        const role = await db.Role.findByPk(user.roleId, { attributes: ['type'] });
        if (role?.type !== '1') {
            return res.status(status.Forbidden).json({ message: 'Only admin can access this API' });
        }

        const topCustomers = await db.CustomerPoints.findAll({
            include: [
                {
                    model: db.Customer,
                    as: 'Customer',
                    attributes: ['firstName', 'lastName', 'phoneNo'],
                },
            ],
            where: {
                totalPoints: { [db.Sequelize.Op.gt]: 0 },
            },
            order: [['totalPoints', 'DESC']],
            limit: 10,
            attributes: ['totalPoints'],
        });
        const formatted = topCustomers.map((entry) => ({
            name: entry.Customer ? `${entry.Customer.firstName} ${entry.Customer.lastName || ''}`.trim() : 'Unknown',
            mobile: entry.Customer?.phoneNo || 'N/A',
            points: entry.totalPoints,
        }));

        return res.status(status.OK).json(formatted);
    } catch (err) {
        console.error(err.message);
        return res.status(status.InternalServerError).json({ message: 'Something went wrong' });
    }
};

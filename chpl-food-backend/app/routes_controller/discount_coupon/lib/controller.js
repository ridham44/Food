const { v4: uuidv4 } = require('uuid');
const db = require('../../../db/models');
const { status, common } = require('../../../../utils');

exports.create = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            await transaction.rollback();
            return res.status(status.Forbidden).json({ message: 'Tenant access only' });
        }

        const {
            code,
            type,
            value,
            maxUsage,
            validFrom,
            validTo,
            description,
            isPublic = false,
            minOrderAmount = 0,
            customerIds = [],
        } = req.body;

        const existing = await db.DiscountCoupon.findOne({ where: { code, tenantId } });
        if (existing) {
            await transaction.rollback();
            return res.status(status.Conflict).json({ message: 'Coupon code already exists' });
        }

        const coupon = await db.DiscountCoupon.create(
            {
                id: uuidv4(),
                tenantId,
                code,
                type,
                value,
                maxUsage,
                validFrom,
                validTo,
                description,
                isPublic,
                minOrderAmount,
                createdAt: new Date(),
            },
            { transaction }
        );

        if (!isPublic && Array.isArray(customerIds) && customerIds.length > 0) {
            const couponUsers = customerIds.map((customerId) => ({
                id: uuidv4(),
                couponId: coupon.id,
                customerId,
                usedCount: 0,
            }));

            await db.DiscountCouponUser.bulkCreate(couponUsers, { transaction });
        }

        await transaction.commit();
        return res.status(status.OK).json({
            message: 'Discount coupon created successfully',
            coupon,
        });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Create Discount Coupon API', req, res);
    }
};

exports.redeemCoupon = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { billId, couponCode } = req.body;

        const bill = await db.OrderBill.findOne({ where: { id: billId, status: '0' }, transaction });
        if (!bill) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Unpaid bill not found' });
        }

        if (bill.couponCode) {
            await transaction.rollback();
            return res.status(status.Conflict).json({
                message: `A coupon (${bill.couponCode}) has already been applied to this bill.`,
            });
        }

        const order = await db.OrderList.findOne({ where: { id: bill.orderListId }, transaction });
        if (!order) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Order not found for bill' });
        }

        const customerId = order.customerId;
        const tenantId = order.tenantId;
        const now = new Date();

        const coupon = await db.DiscountCoupon.findOne({
            where: {
                code: couponCode,
                tenantId,
                validFrom: { [db.Sequelize.Op.lte]: now },
                validTo: { [db.Sequelize.Op.gte]: now },
            },
            transaction,
        });

        if (!coupon) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Coupon is invalid or expired' });
        }

        const totalAmount = parseFloat(bill.totalAmount);

        if (coupon.minOrderAmount && totalAmount < parseFloat(coupon.minOrderAmount)) {
            await transaction.rollback();
            return res.status(status.NotAcceptable).json({
                message: `Minimum order amount ₹${coupon.minOrderAmount} required to use this coupon.`,
            });
        }

        let userCoupon = await db.DiscountCouponUser.findOne({
            where: {
                couponId: coupon.id,
                customerId,
            },
            transaction,
        });

        if (coupon.isPublic) {
            if (userCoupon && userCoupon.usedCount >= coupon.maxUsage) {
                await transaction.rollback();
                return res.status(status.Forbidden).json({
                    message: 'Coupon usage limit reached for this customer',
                });
            }

            if (!userCoupon) {
                await db.DiscountCouponUser.create(
                    {
                        id: uuidv4(),
                        couponId: coupon.id,
                        customerId,
                        usedCount: 1,
                    },
                    { transaction }
                );
            } else {
                await db.DiscountCouponUser.update(
                    { usedCount: db.Sequelize.literal('usedCount + 1') },
                    {
                        where: { couponId: coupon.id, customerId },
                        transaction,
                    }
                );
            }
        } else {
            if (!userCoupon) {
                await transaction.rollback();
                return res.status(status.Forbidden).json({
                    message: 'You are not authorized to use this coupon',
                });
            }

            if (userCoupon.usedCount >= coupon.maxUsage) {
                await transaction.rollback();
                return res.status(status.Forbidden).json({
                    message: 'Coupon usage limit reached for this customer',
                });
            }

            await db.DiscountCouponUser.update(
                { usedCount: db.Sequelize.literal('usedCount + 1') },
                {
                    where: { couponId: coupon.id, customerId },
                    transaction,
                }
            );
        }

        let discountAmount = 0;
        if (coupon.type === 'flat') {
            discountAmount = parseFloat(coupon.value);
        } else if (coupon.type === 'percent') {
            discountAmount = (totalAmount * parseFloat(coupon.value)) / 100;
        }

        if (discountAmount > totalAmount) discountAmount = totalAmount;
        const finalAmount = (totalAmount - discountAmount).toFixed(2);

        await db.OrderBill.update(
            {
                couponCode: coupon.code,
                discountAmount,
                finalAmount,
            },
            { where: { id: billId }, transaction }
        );

        await transaction.commit();
        return res.status(status.OK).json({
            message: `Coupon applied successfully. ₹${discountAmount.toFixed(2)} off.`,
            finalAmount,
        });
    } catch (error) {
        await transaction.rollback();
        return res.status(status.InternalServerError).json({
            message: error.message || 'Failed to redeem coupon',
        });
    }
};

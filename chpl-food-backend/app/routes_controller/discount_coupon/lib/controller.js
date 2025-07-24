const { v4: uuidv4 } = require('uuid');
const db = require('../../../db/models');
const { status, common } = require('../../../../utils');
const logActivity = require('../../../../utils/lib/auditLog/activityLogger');

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
            isActive = '1',
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
                isActive,
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

        await logActivity(req, 'create', coupon);

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
        const { billId, couponCode, points } = req.body;

        const bill = await db.OrderBill.findOne({
            where: { id: billId, status: '0' },
            transaction,
        });

        if (!bill) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Unpaid bill not found' });
        }

        const oldData = JSON.parse(JSON.stringify(bill.get({ plain: true })));

        if (bill.couponCode || bill.pointsUsed > 0) {
            await transaction.rollback();
            return res.status(status.Conflict).json({
                message: `Coupon or points already applied to this bill.`,
            });
        }

        const order = await db.OrderList.findOne({
            where: { id: bill.orderListId },
            transaction,
        });

        if (!order) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Order not found for bill' });
        }

        const { customerId, tenantId } = order;
        const totalAmount = parseFloat(bill.totalAmount);
        let discountAmount = 0;

        if (points) {
            const cp = await db.CustomerPoints.findOne({
                where: { customerId },
                transaction,
            });

            if (!cp || cp.totalPoints < points) {
                await transaction.rollback();
                return res.status(status.Forbidden).json({
                    message: 'Not enough points to redeem',
                });
            }

            discountAmount = parseFloat(points);

            if (discountAmount > totalAmount) discountAmount = totalAmount;

            await db.CustomerPoints.update(
                {
                    totalPoints: db.Sequelize.literal(`totalPoints - ${discountAmount}`),
                },
                { where: { customerId }, transaction }
            );
        }

        if (couponCode) {
            const now = new Date();

            const coupon = await db.DiscountCoupon.findOne({
                where: {
                    code: couponCode,
                    tenantId,
                    isActive: '1',
                    validFrom: { [db.Sequelize.Op.lte]: now },
                    validTo: { [db.Sequelize.Op.gte]: now },
                },
                transaction,
            });

            if (!coupon) {
                await transaction.rollback();
                return res.status(status.NotFound).json({ message: 'Coupon is invalid or expired' });
            }

            if (coupon.minOrderAmount && totalAmount < parseFloat(coupon.minOrderAmount)) {
                await transaction.rollback();
                return res.status(status.NotAcceptable).json({
                    message: `Minimum order amount ₹${coupon.minOrderAmount} required to use this coupon.`,
                });
            }

            let userCoupon = await db.DiscountCouponUser.findOne({
                where: { couponId: coupon.id, customerId },
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

            let couponDiscount = 0;

            if (coupon.type === 'flat') {
                couponDiscount = parseFloat(coupon.value);
            } else if (coupon.type === 'percent') {
                couponDiscount = (totalAmount * parseFloat(coupon.value)) / 100;
            }

            if (couponDiscount > totalAmount) couponDiscount = totalAmount;

            discountAmount += couponDiscount;
        }

        const finalAmount = (totalAmount - discountAmount).toFixed(2);

        await db.OrderBill.update(
            {
                couponCode: couponCode || null,
                pointsUsed: parseInt(points) || 0,
                discountAmount,
                finalAmount,
            },
            { where: { id: billId }, transaction }
        );

        const newData = await db.OrderBill.findOne({ where: { id: billId }, transaction });
        await logActivity(req, 'update', newData, oldData);

        await transaction.commit();
        return res.status(status.OK).json({
            message: `₹${discountAmount.toFixed(2)} discount applied${couponCode ? ' using coupon ' + couponCode : ' using points'}.`,
            finalAmount,
        });
    } catch (error) {
        await transaction.rollback();
        return res.status(status.InternalServerError).json({
            message: error.message || 'Failed to apply discount',
        });
    }
};

exports.updateCoupon = async (req, res) => {
    const { id } = req.params;
    const { isActive, validTo, customerIds } = req.body;
    const tenantId = req.user.tenantId;

    const transaction = await db.sequelize.transaction();

    try {
        const coupon = await db.DiscountCoupon.findOne({
            where: { id, tenantId },
            transaction,
        });

        const oldData = JSON.parse(JSON.stringify(coupon.get({ plain: true })));

        if (!coupon) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Coupon not found' });
        }

        const updateFields = {};
        if (isActive !== undefined) updateFields.isActive = isActive;
        if (validTo) updateFields.validTo = validTo;

        coupon.set(updateFields);
        await coupon.save({ transaction });

        if (Array.isArray(customerIds) && customerIds.length > 0) {
            const existing = await db.DiscountCouponCustomer.findAll({
                where: { couponId: id },
                attributes: ['customerId'],
                raw: true,
                transaction,
            });

            const existingIds = existing.map((e) => e.customerId);

            const newEntries = customerIds.filter((cid) => !existingIds.includes(cid)).map((cid) => ({ couponId: id, customerId: cid }));

            if (newEntries.length > 0) {
                await db.DiscountCouponCustomer.bulkCreate(newEntries, { transaction });
            }
        }

        await transaction.commit();
        const newcoupon = await db.DiscountCoupon.findOne({
            where: { id, tenantId },
            transaction,
        });
        await logActivity(req, 'update', newcoupon, oldData);

        return res.status(status.OK).json({ message: 'Coupon updated successfully' });
    } catch (error) {
        await transaction.rollback();
        console.error(error);
        return res.status(status.Forbidden).json({ message: 'Something went wrong' });
    }
};

exports.updateCouponStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        const tenantId = req.user.tenantId;

        if (!['0', '1'].includes(isActive)) {
            return res.status(status.BadRequest).json({ message: 'isActive must be "0" or "1"' });
        }

        const coupon = await db.DiscountCoupon.findOne({
            where: { id, tenantId },
        });

        const oldData = JSON.parse(JSON.stringify(coupon.get({ plain: true })));

        if (!coupon) {
            return res.status(status.NotFound).json({ message: 'Coupon not found' });
        }

        coupon.isActive = isActive;
        await coupon.save();

        const newcoupon = await db.DiscountCoupon.findOne({
            where: { id, tenantId },
        });
        await logActivity(req, 'update', newcoupon, oldData);
        return res.status(status.OK).json({ message: 'Coupon status updated successfully' });
    } catch (error) {
        console.error('Error updating coupon status:', error);
        return res.status(status.InternalServerError).json({ message: 'Failed to update status' });
    }
};

exports.couponReport = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;

        const coupons = await db.DiscountCoupon.findAll({
            where: { tenantId },
            attributes: ['id', 'code', 'type', 'value', 'maxUsage', 'isPublic', 'isActive', 'validFrom', 'validTo'],
            include: [
                {
                    model: db.DiscountCouponUser,
                    as: 'DiscountCouponUser',
                    attributes: ['id', 'customerId', 'usedCount'],
                    include: [
                        {
                            model: db.Customer,
                            as: 'Customer',
                            attributes: ['id', 'firstName', 'lastName', 'phoneNo'],
                        },
                    ],
                },
            ],
            order: [['validTo', 'DESC']],
        });

        const report = coupons.map((coupon) => {
            const redemptions = coupon.DiscountCouponUser || [];
            return {
                id: coupon.id,
                code: coupon.code,
                type: coupon.type,
                value: coupon.value,
                maxUsage: coupon.maxUsage,
                totalRedeemed: redemptions.length,
                remaining: coupon.maxUsage - redemptions.length,
                isPublic: coupon.isPublic ? 'Yes' : 'No',
                isActive: coupon.isActive === '1' ? 'Active' : 'Inactive',
                validFrom: coupon.validFrom,
                validTo: coupon.validTo,
                users: redemptions.map((r) => ({
                    name: r.Customer?.firstName || 'N/A',
                    mobile: r.Customer?.phoneNo || 'N/A',
                })),
            };
        });

        return res.status(status.OK).json({
            message: 'Coupon report generated successfully',
            data: report,
        });
    } catch (error) {
        console.error('Coupon Report Error:', error.message);
        return res.status(status.InternalServerError).json({ message: 'Failed to generate report' });
    }
};

exports.getCouponDetails = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { id } = req.params;

        const coupon = await db.DiscountCoupon.findOne({
            where: {
                id,
                tenantId,
            },
            attributes: ['id', 'code', 'type', 'value', 'maxUsage', 'isPublic', 'isActive', 'validFrom', 'validTo'],
            include: [
                {
                    model: db.DiscountCouponUser,
                    as: 'DiscountCouponUser',
                    attributes: ['id', 'customerId', 'usedCount'],
                    include: [
                        {
                            model: db.Customer,
                            as: 'Customer',
                            attributes: ['id', 'firstName', 'lastName', 'phoneNo'],
                        },
                    ],
                },
            ],
        });

        if (!coupon) {
            return res.status(status.NotFound).json({ message: 'Coupon not found' });
        }

        const redemptions = coupon.DiscountCouponUser || [];

        const response = {
            id: coupon.id,
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            maxUsage: coupon.maxUsage,
            totalRedeemed: redemptions.length,
            remaining: coupon.maxUsage - redemptions.length,
            isPublic: coupon.isPublic ? 'Yes' : 'No',
            isActive: coupon.isActive === '1' ? 'Active' : 'Inactive',
            validFrom: coupon.validFrom,
            validTo: coupon.validTo,
        };

        if (!coupon.isPublic) {
            response.users = redemptions.map((r) => ({
                name: `${r.Customer?.firstName || 'N/A'} ${r.Customer?.lastName || ''}`.trim(),
                mobile: r.Customer?.phoneNo || 'N/A',
                usedCount: r.usedCount || 0,
            }));
        }

        return res.status(status.OK).json({
            message: 'Coupon details fetched successfully',
            coupon: response,
        });
    } catch (error) {
        console.error('Coupon Detail Error:', error.message);
        return res.status(status.InternalServerError).json({ message: 'Failed to fetch coupon details' });
    }
};

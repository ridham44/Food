const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db = require('../../../db/models');
const { status, common, razorpayInstance } = require('../../../../utils');
const { priceCartItems, computeTaxAndFees, round2 } = require('../../../../utils/lib/orderPricing');
const { assignPointsOnOrder } = require('../../Customer_points/lib/controller');

// Read-only: validates a coupon against a priced cart and returns the
// discount it would apply. Does NOT touch DiscountCouponUser — that only
// happens once payment is confirmed (completeOrderFromPendingPayment), so an
// abandoned checkout never burns the customer's coupon use for nothing.
async function validateCoupon({ tenantId, customerId, couponCode, totalAmount }) {
    const now = new Date();
    const coupon = await db.DiscountCoupon.findOne({
        where: {
            code: couponCode,
            tenantId,
            isActive: '1',
            validFrom: { [db.Sequelize.Op.lte]: now },
            validTo: { [db.Sequelize.Op.gte]: now },
        },
    });

    if (!coupon) {
        const err = new Error('Coupon is invalid or expired');
        err.status = status.NotFound;
        throw err;
    }

    if (coupon.minOrderAmount && totalAmount < parseFloat(coupon.minOrderAmount)) {
        const err = new Error(`Minimum order amount $${coupon.minOrderAmount} required to use this coupon.`);
        err.status = status.NotAcceptable;
        throw err;
    }

    const existingUsage = await db.DiscountCouponUser.findOne({ where: { couponId: coupon.id, customerId } });

    if (!coupon.isPublic && !existingUsage) {
        const err = new Error('This coupon is not available for your account');
        err.status = status.Forbidden;
        throw err;
    }

    if (existingUsage && existingUsage.usedCount >= coupon.maxUsage) {
        const err = new Error('Coupon usage limit reached for this customer');
        err.status = status.Forbidden;
        throw err;
    }

    let discountAmount = coupon.type === 'percent' ? (totalAmount * parseFloat(coupon.value)) / 100 : parseFloat(coupon.value);
    if (discountAmount > totalAmount) discountAmount = totalAmount;

    return { coupon, discountAmount: round2(discountAmount) };
}

// Write: only called once payment is confirmed, inside the order-creation transaction.
async function commitCouponUsage({ coupon, customerId }, transaction) {
    const existing = await db.DiscountCouponUser.findOne({ where: { couponId: coupon.id, customerId }, transaction });
    if (existing) {
        existing.usedCount += 1;
        await existing.save({ transaction });
    } else {
        await db.DiscountCouponUser.create({ id: uuidv4(), couponId: coupon.id, customerId, usedCount: 1 }, { transaction });
    }
}

exports.getPaymentConfig = async (req, res) => {
    return res.status(status.OK).json({ keyId: process.env.RAZORPAY_KEY_ID || null, currency: 'INR' });
};

exports.createRazorpayOrder = async (req, res) => {
    try {
        if (req.userType !== 'customer') {
            return res.status(status.Forbidden).json({ message: 'Customer access only' });
        }
        if (!razorpayInstance) {
            return res.status(status.InternalServerError).json({ message: 'Payment gateway is not configured' });
        }

        const customerId = req.user.id;
        const { tenantId, items, isParcel, orderType, tableNumber, deliveryAddressId, couponCode } = req.body;

        const { totalAmount, pricedItems } = await priceCartItems({ tenantId, items });

        let deliveryAddressSnapshot = null;
        const resolvedOrderType = orderType || (isParcel === '1' ? 'takeaway' : 'dine_in');
        if (resolvedOrderType === 'delivery') {
            const address = await db.CustomerAddress.findOne({ where: { id: deliveryAddressId, customerId } });
            if (!address) {
                return res.status(status.NotFound).json({ message: 'Delivery address not found' });
            }
            deliveryAddressSnapshot = {
                label: address.label,
                contactName: address.contactName,
                contactPhone: address.contactPhone,
                addressLine: address.addressLine,
                pincode: address.pincode,
            };
        }

        const { gstPercent, gstAmount, packingFee } = await computeTaxAndFees({
            tenantId,
            totalAmount,
            isParcel: isParcel === '1' ? '1' : '0',
        });

        let discountAmount = 0;
        let appliedCouponCode = null;
        if (couponCode) {
            const { discountAmount: d } = await validateCoupon({ tenantId, customerId, couponCode, totalAmount });
            discountAmount = d;
            appliedCouponCode = couponCode;
        }

        const finalAmount = round2(totalAmount + gstAmount + packingFee - discountAmount);
        if (finalAmount <= 0) {
            return res.status(status.BadRequest).json({ message: 'Order amount must be greater than 0' });
        }

        const amountInPaise = Math.round(finalAmount * 100);
        const pendingId = uuidv4();

        const razorpayOrder = await razorpayInstance.orders.create({
            amount: amountInPaise,
            currency: 'INR',
            receipt: pendingId,
            notes: { tenantId, customerId },
        });

        await db.RazorpayOrder.create({
            id: pendingId,
            razorpayOrderId: razorpayOrder.id,
            customerId,
            tenantId,
            amount: finalAmount,
            currency: 'INR',
            status: 'created',
            cartSnapshot: JSON.stringify({
                pricedItems,
                isParcel: isParcel === '1' ? '1' : '0',
                orderType: resolvedOrderType,
                tableNumber: tableNumber || null,
                deliveryAddressId: resolvedOrderType === 'delivery' ? deliveryAddressId : null,
                deliveryAddressSnapshot,
                couponCode: appliedCouponCode,
                totalAmount,
                gstPercent,
                gstAmount,
                packingFee,
                discountAmount,
            }),
            createdAt: new Date(),
        });

        return res.status(status.OK).json({
            message: 'Razorpay order created',
            pendingPaymentId: pendingId,
            razorpayOrderId: razorpayOrder.id,
            amount: finalAmount,
            amountInPaise,
            currency: 'INR',
            keyId: process.env.RAZORPAY_KEY_ID,
            breakdown: { subtotal: totalAmount, gstPercent, gstAmount, packingFee, discountAmount, finalAmount },
        });
    } catch (error) {
        return res.status(error.status || status.InternalServerError).json({ message: error.message });
    }
};

/**
 * Shared by the synchronous verify endpoint and the webhook so both paths
 * complete an order identically. Re-reads the RazorpayOrder row WITH a row
 * lock inside its own transaction, so whichever caller (verify call vs.
 * webhook) gets there first wins and the other short-circuits as already
 * completed — this is what makes concurrent verify+webhook calls safe.
 */
async function completeOrderFromPendingPayment(pendingId, razorpayPaymentId) {
    return db.sequelize.transaction(async (transaction) => {
        const row = await db.RazorpayOrder.findOne({
            where: { id: pendingId },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        if (!row) throw Object.assign(new Error('Pending payment not found'), { status: status.NotFound });

        if (row.status === 'completed') {
            const bill = await db.OrderBill.findOne({ where: { orderListId: row.orderListId }, transaction });
            return { orderListId: row.orderListId, billId: bill?.id, finalAmount: parseFloat(row.amount) };
        }

        const snapshot = JSON.parse(row.cartSnapshot);
        const orderListId = uuidv4();

        await db.OrderList.create(
            {
                id: orderListId,
                customerId: row.customerId,
                tenantId: row.tenantId,
                placedBy: '1',
                status: '2',
                isParcel: snapshot.isParcel,
                orderType: snapshot.orderType,
                tableNumber: snapshot.tableNumber,
                deliveryAddressId: snapshot.deliveryAddressId,
                deliveryAddressSnapshot: snapshot.deliveryAddressSnapshot ? JSON.stringify(snapshot.deliveryAddressSnapshot) : null,
                createdAt: new Date(),
            },
            { transaction }
        );

        const orderItems = snapshot.pricedItems.map((item) => ({
            id: uuidv4(),
            orderListId,
            menuId: item.menuId,
            comboId: item.comboId,
            quantity: item.quantity,
            specialInstruction: item.specialInstruction,
            totalPrice: item.totalPrice,
            createdAt: new Date(),
        }));
        await db.OrderItem.bulkCreate(orderItems, { transaction });

        const bill = await db.OrderBill.create(
            {
                id: uuidv4(),
                orderListId,
                totalAmount: snapshot.totalAmount,
                couponCode: snapshot.couponCode,
                discountAmount: snapshot.discountAmount,
                finalAmount: row.amount,
                pointsUsed: 0,
                status: '1',
                packingFee: snapshot.packingFee,
                gstPercent: snapshot.gstPercent,
                createdAt: new Date(),
            },
            { transaction }
        );

        await db.OrderPayment.create(
            {
                id: uuidv4(),
                orderBillId: bill.id,
                cash: 0,
                card: 0,
                online: row.amount,
                amountPaid: row.amount,
                status: 'paid',
                razorpayOrderId: row.razorpayOrderId,
                razorpayPaymentId,
                pendingPaymentId: row.id,
                createdAt: new Date(),
            },
            { transaction }
        );

        if (snapshot.couponCode) {
            const coupon = await db.DiscountCoupon.findOne({ where: { code: snapshot.couponCode, tenantId: row.tenantId }, transaction });
            if (coupon) await commitCouponUsage({ coupon, customerId: row.customerId }, transaction);
        }

        row.status = 'completed';
        row.orderListId = orderListId;
        row.razorpayPaymentId = razorpayPaymentId;
        await row.save({ transaction });

        return { orderListId, billId: bill.id, finalAmount: parseFloat(row.amount) };
    }).then(async (result) => {
        // Loyalty points are assigned outside the main transaction, same as
        // approveOrRejectOrder/tenantPlaceOrder already do — best-effort,
        // never blocks the order itself if it fails.
        try {
            await assignPointsOnOrder(result.orderListId);
        } catch (_err) {
            // best-effort — points aren't part of the core order guarantee
        }
        return result;
    });
}

function verifySignature(orderId, paymentId, signature, secret) {
    const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
    const expectedBuf = Buffer.from(expected, 'utf8');
    const actualBuf = Buffer.from(String(signature), 'utf8');
    if (expectedBuf.length !== actualBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

exports.verifyAndCompleteOrder = async (req, res) => {
    try {
        if (req.userType !== 'customer') {
            return res.status(status.Forbidden).json({ message: 'Customer access only' });
        }

        const { pendingPaymentId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const isValid = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, process.env.RAZORPAY_KEY_SECRET);
        if (!isValid) {
            return res.status(status.BadRequest).json({ message: 'Payment verification failed — signature mismatch' });
        }

        const row = await db.RazorpayOrder.findOne({
            where: { id: pendingPaymentId, razorpayOrderId: razorpay_order_id, customerId: req.user.id },
        });
        if (!row) return res.status(status.NotFound).json({ message: 'Pending payment not found' });

        if (row.status === 'failed' || row.status === 'expired') {
            return res.status(status.Conflict).json({ message: 'This payment attempt is no longer valid' });
        }

        if (row.status === 'created') {
            row.status = 'paid';
            row.razorpayPaymentId = razorpay_payment_id;
            await row.save();
        }

        const result = await completeOrderFromPendingPayment(row.id, razorpay_payment_id);
        return res.status(status.OK).json({ message: 'Payment verified, order placed', ...result });
    } catch (error) {
        return common.throwException(error, 'Verify Razorpay Payment API', req, res);
    }
};

exports.handleWebhook = async (req, res) => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOKS_SECRET;
        const signature = req.headers['x-razorpay-signature'];

        if (!secret || !signature || !req.rawBody) {
            return res.status(status.BadRequest).json({ message: 'Missing webhook signature' });
        }

        const expected = crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex');
        const expectedBuf = Buffer.from(expected, 'utf8');
        const actualBuf = Buffer.from(String(signature), 'utf8');
        if (expectedBuf.length !== actualBuf.length || !crypto.timingSafeEqual(expectedBuf, actualBuf)) {
            return res.status(status.BadRequest).json({ message: 'Invalid webhook signature' });
        }

        const event = req.body.event;
        const payment = req.body.payload?.payment?.entity;
        if (!payment) return res.status(status.OK).json({ message: 'Ignored — no payment entity' });

        const row = await db.RazorpayOrder.findOne({ where: { razorpayOrderId: payment.order_id } });
        if (!row) return res.status(status.OK).json({ message: 'Ignored — unknown order' });

        if (row.status === 'completed') {
            return res.status(status.OK).json({ message: 'Already completed' });
        }

        if (event === 'payment.failed') {
            if (row.status === 'created') {
                row.status = 'failed';
                row.failureReason = payment.error_description || 'Payment failed';
                await row.save();
            }
            return res.status(status.OK).json({ message: 'Marked as failed' });
        }

        if (event === 'payment.captured' || event === 'order.paid') {
            await completeOrderFromPendingPayment(row.id, payment.id);
            return res.status(status.OK).json({ message: 'Order completed via webhook' });
        }

        return res.status(status.OK).json({ message: 'Ignored — unhandled event' });
    } catch (error) {
        console.error('Razorpay webhook error:', error.message);
        return res.status(status.InternalServerError).json({ message: 'Webhook processing failed' });
    }
};

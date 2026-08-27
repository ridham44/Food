const db = require('../../../db/models');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { status, common } = require('../../../../utils');
const { assignPointsOnOrder } = require('../../Customer_points/lib/controller');
const logActivity = require('../../../../utils/lib/auditLog/activityLogger');

const KITCHEN_SEQUENCE = ['new', 'preparing', 'ready', 'completed'];

exports.orderCustomer = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const customerId = req.user.id;
        const { tenantId, items, isParcel, orderType, tableNumber } = req.body;

        if (!Array.isArray(items) || items.length === 0 || !tenantId) {
            return res.status(status.BadRequest).json({ message: 'tenantId and items are required' });
        }

        const menuIds = items.filter((i) => i.menuId).map((i) => i.menuId);
        const comboIds = items.filter((i) => i.comboId).map((i) => i.comboId);

        const menus = await db.Menu.findAll({
            where: { id: menuIds, isAvailable: '1' },
            raw: true,
            disableTenantCheck: true,
        });

        const combos = await db.ComboGroup.findAll({
            where: { id: comboIds },
            raw: true,
            disableTenantCheck: true,
        });

        if (menus.length !== menuIds.length || combos.length !== comboIds.length) {
            return res.status(status.BadRequest).json({ message: 'Invalid menuId or comboId in items' });
        }

        const orderListId = uuidv4();
        const orderlist = await db.OrderList.create(
            {
                id: orderListId,
                customerId,
                tenantId,
                placedBy: '1',
                status: '1',
                isParcel: isParcel === '1' ? '1' : '0',
                orderType: orderType || (isParcel === '1' ? 'takeaway' : 'dine_in'),
                tableNumber: tableNumber || null,
                createdAt: new Date(),
            },
            { transaction }
        );

        const orderItems = items
            .map((item) => {
                const now = new Date();
                let price = 0;
                let totalPrice = 0;

                if (item.menuId) {
                    const menu = menus.find((m) => m.id === item.menuId);
                    if (!menu) return null;

                    price = parseFloat(menu.price);
                    totalPrice = price * item.quantity;

                    return {
                        id: uuidv4(),
                        orderListId,
                        menuId: item.menuId,
                        comboId: null,
                        quantity: item.quantity,
                        specialInstruction: item.specialInstruction || null,
                        totalPrice,
                        createdAt: now,
                    };
                }

                if (item.comboId) {
                    const combo = combos.find((c) => c.id === item.comboId);
                    if (!combo) return null;

                    price = parseFloat(combo.price);
                    totalPrice = price * item.quantity;

                    return {
                        id: uuidv4(),
                        orderListId,
                        comboId: item.comboId,
                        menuId: null,
                        quantity: item.quantity,
                        specialInstruction: item.specialInstruction || null,
                        totalPrice,
                        createdAt: now,
                    };
                }

                return null;
            })
            .filter(Boolean);

        await db.OrderItem.bulkCreate(orderItems, { transaction });
        await transaction.commit();

        await logActivity(req, 'create', orderlist);

        return res.status(status.OK).json({
            message: 'Order placed successfully',
            orderListId,
            items: orderItems,
        });
    } catch (error) {
        await transaction.rollback();
        return res.status(status.InternalServerError).json({ message: error.message });
    }
};

exports.approveOrRejectOrder = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { orderListId, status: newStatus, cancelReason } = req.body;
        const user = req.user;
        const tenantId = user.tenantId;
        const userRoleId = user.roleId;

        if (!orderListId || !['2', '3'].includes(newStatus)) {
            return res.status(status.BadRequest).json({ message: 'Valid orderListId and status (2 or 3) are required' });
        }

        const role = await db.Role.findOne({ where: { id: userRoleId }, attributes: ['type'], raw: true });
        const isCustomer = role?.type === '3';

        const whereCondition = { id: orderListId, status: '1' };

        if (!isCustomer) {
            whereCondition.tenantId = tenantId;
        }

        const order = await db.OrderList.findOne({ where: whereCondition });

        if (!order) {
            return res.status(status.NotFound).json({ message: 'Order not found or already processed' });
        }

        if (isCustomer && newStatus === '2') {
            return res.status(status.Forbidden).json({ message: 'Customers are not allowed to approve orders' });
        }

        const updateData = {
            status: newStatus,
            updatedAt: new Date(),
        };

        if (newStatus === '3') {
            if (!cancelReason || cancelReason.trim() === '') {
                return res.status(status.BadRequest).json({ message: 'Cancel reason is required when cancelling an order' });
            }
            updateData.cancelReason = cancelReason;
            updateData.cancelledBy = isCustomer ? '0' : '1';
        }

        await db.OrderList.update(updateData, { where: { id: orderListId }, transaction });

        if (newStatus === '2' && !isCustomer) {
            const items = await db.OrderItem.findAll({
                where: { orderListId },
                attributes: ['totalPrice'],
                raw: true,
            });

            const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);

            const taxConfig = await db.TaxConfig.findOne({
                where: { tenantId, status: '1' },
                raw: true,
            });

            const gst = taxConfig ? (totalAmount * parseFloat(taxConfig.gst)) / 100 : 0;
            const packingFee = order.isParcel === '1' && taxConfig ? parseFloat(taxConfig.packingFee) : 0;
            const finalAmount = totalAmount + gst + packingFee;

            const bill = await db.OrderBill.create(
                {
                    id: uuidv4(),
                    orderListId,
                    totalAmount,
                    status: '0',
                    gstPercent: taxConfig.gst,
                    packingFee: packingFee.toFixed(2),
                    finalAmount,
                    createdAt: new Date(),
                },
                { transaction }
            );

            await assignPointsOnOrder(orderListId);
            await logActivity(req, 'create', bill);
        }

        await transaction.commit();

        return res.status(status.OK).json({
            message:
                newStatus === '2'
                    ? 'Order approved and bill generated'
                    : isCustomer
                      ? 'Order cancelled by customer'
                      : 'Order rejected by tenant',
        });
    } catch (err) {
        await transaction.rollback();
        return res.status(status.InternalServerError).json({ message: err.message });
    }
};

exports.tenantPlaceOrder = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const tenantId = req.user.tenantId;
        const { mobile, name, gender, items, isParcel, orderType, tableNumber } = req.body;

        if (!mobile || !Array.isArray(items) || items.length === 0) {
            return res.status(status.BadRequest).json({ message: 'Mobile and at least one item are required' });
        }

        let customer = await db.Customer.findOne({ where: { phoneNo: mobile }, transaction });

        if (!customer && !name) {
            return res.status(status.BadRequest).json({ message: 'New customer requires name' });
        }

        if (!customer) {
            const CUSTOMER_ROLE_ID = '6cff3da0-02d8-11ef-8c8d-74563c33253';

            const [firstName, ...rest] = name.trim().split(' ');
            const lastName = rest.length > 0 ? rest.join(' ') : null;

            customer = await db.Customer.create(
                {
                    id: uuidv4(),
                    phoneNo: mobile,
                    firstName,
                    lastName,
                    gender: gender || null,
                    roleId: CUSTOMER_ROLE_ID,
                    createdAt: new Date(),
                },
                { transaction }
            );
        }

        const customerId = customer.id;

        const menuIds = items.filter((i) => i.menuId).map((i) => i.menuId);
        const comboIds = items.filter((i) => i.comboId).map((i) => i.comboId);

        const menus = await db.Menu.findAll({
            where: { id: menuIds, isAvailable: '1' },
            raw: true,
            disableTenantCheck: true,
        });

        const combos = await db.ComboGroup.findAll({
            where: { id: comboIds },
            raw: true,
            disableTenantCheck: true,
        });

        if (menus.length !== menuIds.length || combos.length !== comboIds.length) {
            return res.status(status.BadRequest).json({ message: 'Invalid menuId or comboId in items' });
        }

        const orderListId = uuidv4();
        const orderlist = await db.OrderList.create(
            {
                id: orderListId,
                customerId,
                tenantId,
                placedBy: '2',
                status: '2',
                isParcel: isParcel === '1' ? '1' : '0',
                orderType: orderType || (isParcel === '1' ? 'takeaway' : 'dine_in'),
                tableNumber: tableNumber || null,
                createdAt: new Date(),
            },
            { transaction }
        );

        let totalAmount = 0;

        const orderItems = items.map((item) => {
            let price = 0;

            if (item.menuId) {
                const menu = menus.find((m) => m.id === item.menuId);
                price = parseFloat(menu.price);
            } else if (item.comboId) {
                const combo = combos.find((c) => c.id === item.comboId);
                price = parseFloat(combo.price);
            }

            const totalPrice = price * item.quantity;
            totalAmount += totalPrice;

            return {
                id: uuidv4(),
                orderListId,
                menuId: item.menuId || null,
                comboId: item.comboId || null,
                quantity: item.quantity,
                specialInstruction: item.specialInstruction || null,
                totalPrice,
                createdAt: new Date(),
            };
        });

        await db.OrderItem.bulkCreate(orderItems, { transaction });

        const taxConfig = await db.TaxConfig.findOne({
            where: { tenantId, status: '1' },
            raw: true,
        });

        const gst = taxConfig ? (totalAmount * parseFloat(taxConfig.gst)) / 100 : 0;
        const packingFee = isParcel === '1' && taxConfig ? parseFloat(taxConfig.packingFee) : 0;
        const finalAmount = totalAmount + gst + packingFee;

        const bill = await db.OrderBill.create(
            {
                id: uuidv4(),
                orderListId,
                totalAmount,
                status: '0',
                finalAmount,
                gstPercent: taxConfig.gst,
                packingFee: packingFee.toFixed(2),
                createdAt: new Date(),
            },
            { transaction }
        );

        await transaction.commit();

        await assignPointsOnOrder(orderListId);
        await logActivity(req, 'create', orderlist);
        await logActivity(req, 'create', bill);

        return res.status(status.OK).json({
            message: 'Order placed and bill generated successfully',
            customerId,
            orderListId,
            totalAmount,
        });
    } catch (err) {
        await transaction.rollback();
        return res.status(status.InternalServerError).json({ message: err.message });
    }
};

exports.updateOrderItemQuantity = async (req, res) => {
    try {
        const { orderItemId, quantity } = req.body;
        const user = req.user;

        if (!orderItemId || typeof quantity !== 'number' || quantity < 1) {
            return res.status(status.BadRequest).json({ message: 'Invalid orderItemId or quantity' });
        }

        const orderItem = await db.OrderItem.findOne({
            where: { id: orderItemId },
            include: [
                {
                    model: db.OrderList,
                    as: 'OrderList',
                    attributes: ['id', 'status', 'tenantId', 'customerId'],
                },
            ],
        });

        if (!orderItem) {
            return res.status(status.NotFound).json({ message: 'Order item not found' });
        }

        const orderList = orderItem.OrderList;

        if (user.tenantId) {
            if (user.tenantId !== orderList.tenantId) {
                return res.status(status.Forbidden).json({ message: 'Access denied: order does not belong to this tenant' });
            }
        } else {
            if (user.id !== orderList.customerId) {
                return res.status(status.Forbidden).json({ message: 'Access denied: order does not belong to this customer' });
            }
        }

        if (orderList.status !== '1') {
            return res.status(status.BadRequest).json({ message: 'Order cannot be updated unless it is pending' });
        }

        const menuItem = await db.Menu.findByPky(orderItem.menuId);
        const newTotalPrice = quantity * parseFloat(menuItem.price);

        await db.OrderItem.update({ quantity, totalPrice: newTotalPrice.toFixed(2) }, { where: { id: orderItemId } });

        return res.status(status.OK).json({
            message: 'Order item quantity updated successfully',
            data: {
                orderItemId,
                newQuantity: quantity,
                newTotalPrice: newTotalPrice.toFixed(2),
            },
        });
    } catch (error) {
        return common.throwException(error, 'Update Order Item Quantity', req, res);
    }
};

exports.addOrderItem = async (req, res) => {
    try {
        const { orderListId, menuId, quantity, specialInstruction } = req.body;

        if (!orderListId || !menuId || typeof quantity !== 'number' || quantity < 1) {
            return res.status(status.BadRequest).json({ message: 'Invalid orderListId, menuId, or quantity' });
        }

        const orderList = await db.OrderList.findOne({
            where: { id: orderListId },
            attributes: ['id', 'status'],
        });

        if (!orderList) {
            return res.status(status.NotFound).json({ message: 'Order list not found' });
        }

        if (orderList.status !== '1') {
            return res.status(status.BadRequest).json({ message: 'Cannot add items unless order is pending' });
        }

        const menuItem = await db.Menu.findOne({
            where: {
                id: menuId,
                isAvailable: '1',
            },
            disableTenantCheck: true,
        });

        if (!menuItem) {
            return res.status(status.NotFound).json({ message: 'Menu item not found' });
        }

        const totalPrice = parseFloat(menuItem.price) * quantity;

        const newItem = await db.OrderItem.create({
            orderListId,
            menuId,
            quantity,
            totalPrice: totalPrice.toFixed(2),
            specialInstruction: specialInstruction || null,
            createdAt: new Date(),
        });

        return res.status(status.OK).json({
            message: 'Menu item added to order successfully',
            data: {
                orderItemId: newItem.id,
                orderListId,
                menuId,
                quantity,
                totalPrice: totalPrice.toFixed(2),
            },
        });
    } catch (error) {
        return common.throwException(error, 'Add Menu Item to Order', req, res);
    }
};

exports.reorderFromPreviousOrder = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const customerId = req.user.id;
        const { tenantId, orderListId, isParcel } = req.body;

        if (!tenantId || !orderListId) {
            return res.status(status.BadRequest).json({ message: 'tenantId and orderListId are required' });
        }

        const previousOrder = await db.OrderList.findOne({
            where: {
                id: orderListId,
                customerId,
                tenantId,
            },
            include: [
                {
                    model: db.OrderItem,
                    as: 'OrderItem',
                },
            ],
        });

        if (!previousOrder || !previousOrder.OrderItem || previousOrder.OrderItem.length === 0) {
            return res.status(status.NotFound).json({ message: 'Previous order not found or has no items' });
        }

        const menuIds = previousOrder.OrderItem.filter((i) => i.menuId).map((i) => i.menuId);
        const comboIds = previousOrder.OrderItem.filter((i) => i.comboId).map((i) => i.comboId);

        const menus = await db.Menu.findAll({
            where: { id: menuIds, isAvailable: '1' },
            raw: true,
            disableTenantCheck: true,
        });

        const combos = await db.ComboGroup.findAll({
            where: { id: comboIds },
            raw: true,
            disableTenantCheck: true,
        });

        if (menus.length !== menuIds.length || combos.length !== comboIds.length) {
            return res.status(status.BadRequest).json({ message: 'One or more items are no longer available' });
        }

        const newOrderListId = uuidv4();
        const now = new Date();

        const newOrderList = await db.OrderList.create(
            {
                id: newOrderListId,
                customerId,
                tenantId,
                placedBy: '1',
                status: '1',
                isParcel: isParcel === '1' ? '1' : '0',
                createdAt: now,
            },
            { transaction }
        );

        const newOrderItems = previousOrder.OrderItem.map((item) => {
            const menu = item.menuId ? menus.find((m) => m.id === item.menuId) : null;
            const combo = item.comboId ? combos.find((c) => c.id === item.comboId) : null;

            if (!menu && !combo) return null;

            const price = menu ? parseFloat(menu.price) : parseFloat(combo.price);
            const totalPrice = price * item.quantity;

            return {
                id: uuidv4(),
                orderListId: newOrderListId,
                menuId: item.menuId || null,
                comboId: item.comboId || null,
                quantity: item.quantity,
                specialInstruction: item.specialInstruction || null,
                totalPrice,
                createdAt: now,
            };
        }).filter(Boolean);

        await db.OrderItem.bulkCreate(newOrderItems, { transaction });
        await transaction.commit();

        await logActivity(req, 'create', newOrderList);

        return res.status(status.OK).json({
            message: 'Order placed successfully from previous order',
            orderListId: newOrderListId,
            items: newOrderItems,
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Reorder Error:', error);
        return res.status(status.InternalServerError).json({ message: error.message });
    }
};

exports.updateKitchenStatus = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        const { kitchenStatus, cancelReason } = req.body;
        const tenantId = req.user.tenantId;

        const order = await db.OrderList.findOne({ where: { id, tenantId }, transaction });
        if (!order) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Order not found' });
        }

        if (order.status !== '2') {
            await transaction.rollback();
            return res.status(status.BadRequest).json({ message: 'Order must be approved before its kitchen status can be updated' });
        }

        if (kitchenStatus === 'cancelled') {
            if (!cancelReason || !cancelReason.trim()) {
                await transaction.rollback();
                return res.status(status.BadRequest).json({ message: 'Cancel reason is required to cancel an order' });
            }
            order.status = '3';
            order.cancelReason = cancelReason;
            order.cancelledBy = '1';
        } else {
            if (!KITCHEN_SEQUENCE.includes(kitchenStatus)) {
                await transaction.rollback();
                return res.status(status.BadRequest).json({ message: 'Invalid kitchenStatus value' });
            }
            const currentIndex = KITCHEN_SEQUENCE.indexOf(order.kitchenStatus);
            const nextIndex = KITCHEN_SEQUENCE.indexOf(kitchenStatus);
            if (nextIndex < currentIndex) {
                await transaction.rollback();
                return res.status(status.BadRequest).json({ message: 'Cannot move kitchen status backward' });
            }
            order.kitchenStatus = kitchenStatus;
        }

        order.updatedAt = new Date();
        await order.save({ transaction });
        await transaction.commit();
        await logActivity(req, 'update', order);

        return res.status(status.OK).json({ message: 'Order status updated successfully', data: order });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Update Kitchen Status API', req, res);
    }
};

exports.listOrders = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { status: orderStatus, kitchenStatus, orderType, search, startDate, endDate, page = 1, pageSize = 20 } = req.query;

        const where = { tenantId };
        if (orderStatus) where.status = orderStatus;
        if (kitchenStatus) where.kitchenStatus = kitchenStatus;
        if (orderType) where.orderType = orderType;

        if (startDate && endDate) {
            where.createdAt = { [Op.between]: [new Date(startDate + ' 00:00:00'), new Date(endDate + ' 23:59:59')] };
        } else if (startDate) {
            where.createdAt = { [Op.gte]: new Date(startDate + ' 00:00:00') };
        } else if (endDate) {
            where.createdAt = { [Op.lte]: new Date(endDate + ' 23:59:59') };
        }

        const customerWhere = {};
        if (search) {
            customerWhere[Op.or] = [
                { firstName: { [Op.like]: `%${search}%` } },
                { lastName: { [Op.like]: `%${search}%` } },
                { phoneNo: { [Op.like]: `%${search}%` } },
            ];
        }

        const limit = parseInt(pageSize) || 20;
        const offset = (parseInt(page) - 1) * limit;

        const { rows, count } = await db.OrderList.findAndCountAll({
            where,
            include: [
                {
                    model: db.Customer,
                    as: 'Customer',
                    attributes: ['id', 'firstName', 'lastName', 'phoneNo'],
                    where: Object.keys(customerWhere).length ? customerWhere : undefined,
                    required: !!search,
                    disableTenantCheck: true,
                },
                {
                    model: db.OrderItem,
                    as: 'OrderItem',
                    attributes: ['id', 'quantity', 'totalPrice'],
                    disableTenantCheck: true,
                },
                {
                    model: db.OrderBill,
                    as: 'OrderBill',
                    attributes: ['id', 'finalAmount', 'status'],
                    required: false,
                    disableTenantCheck: true,
                },
            ],
            distinct: true,
            limit,
            offset,
            order: [['createdAt', 'DESC']],
        });

        const data = rows.map((row) => {
            const plain = row.get({ plain: true });
            const itemCount = (plain.OrderItem || []).reduce((sum, i) => sum + i.quantity, 0);
            const bill = plain.OrderBill && plain.OrderBill[0] ? plain.OrderBill[0] : null;
            return {
                id: plain.id,
                customerName: plain.Customer ? `${plain.Customer.firstName} ${plain.Customer.lastName}`.trim() : null,
                customerMobile: plain.Customer ? plain.Customer.phoneNo : null,
                itemCount,
                total: bill ? parseFloat(bill.finalAmount) : null,
                paymentStatus: bill ? bill.status : null,
                orderType: plain.orderType,
                tableNumber: plain.tableNumber,
                isParcel: plain.isParcel,
                status: plain.status,
                kitchenStatus: plain.kitchenStatus,
                createdAt: plain.createdAt,
            };
        });

        return res.status(status.OK).json({ data: { rows: data, count } });
    } catch (error) {
        return common.throwException(error, 'List Orders API', req, res);
    }
};

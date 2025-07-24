const db = require('../../../db/models');
const { v4: uuidv4 } = require('uuid');
const { status, common } = require('../../../../utils');
const { assignPointsOnOrder } = require('../../Customer_points/lib/controller');
const logActivity = require('../../../../utils/lib/auditLog/activityLogger');

exports.orderCustomer = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const customerId = req.user.id;
        const { tenantId, items } = req.body;

        if (!Array.isArray(items) || items.length === 0 || !tenantId) {
            return res.status(status.BadRequest).json({ message: 'tenantId and items are required' });
        }

        const menuIds = items.filter((i) => i.menuId).map((i) => i.menuId);
        const comboIds = items.filter((i) => i.comboId).map((i) => i.comboId);

        const menus = await db.Menu.findAll({
            where: { id: menuIds },
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
        const { orderListId, status: newStatus } = req.body;
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

        await db.OrderList.update({ status: newStatus }, { where: { id: orderListId }, transaction });

        if (newStatus === '2' && !isCustomer) {
            const items = await db.OrderItem.findAll({
                where: { orderListId },
                attributes: ['totalPrice'],
                raw: true,
            });

            const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);

            const bill = await db.OrderBill.create(
                {
                    id: uuidv4(),
                    orderListId,
                    totalAmount,
                    status: '0',
                    finalAmount: totalAmount,
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
        const { mobile, name, gender, items } = req.body;

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
            where: { id: menuIds },
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
                totalPrice,
                createdAt: new Date(),
            };
        });

        await db.OrderItem.bulkCreate(orderItems, { transaction });

        const bill = await db.OrderBill.create(
            {
                id: uuidv4(),
                orderListId,
                totalAmount,
                status: '0',
                finalAmount: totalAmount,
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

        const menuItem = await db.Menu.findByPk(orderItem.menuId);
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
        const { orderListId, menuId, quantity } = req.body;

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

        const menuItem = await db.Menu.findByPk(menuId);

        if (!menuItem) {
            return res.status(status.NotFound).json({ message: 'Menu item not found' });
        }

        const totalPrice = parseFloat(menuItem.price) * quantity;

        const newItem = await db.OrderItem.create({
            orderListId,
            menuId,
            quantity,
            totalPrice: totalPrice.toFixed(2),
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

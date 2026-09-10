const { v4: uuidv4 } = require('uuid');
const db = require('../../../db/models');
const { status, common } = require('../../../../utils');
const logActivity = require('../../../../utils/lib/auditLog/activityLogger');
exports.createComboGroup = async (req, res) => {
    const { name, comboPrice, items } = req.body;
    const tenantId = req.user.tenantId;

    const transaction = await db.ComboGroup.sequelize.transaction();

    try {
        const menuIds = items.map((item) => item.menuId);
        const availableMenus = await db.Menu.findAll({
            where: {
                id: menuIds,
                isAvailable: '1',
                tenantId,
            },
            attributes: ['id'],
            raw: true,
        });

        const availableMenuIds = availableMenus.map((m) => m.id);
        const unavailableMenuIds = menuIds.filter((id) => !availableMenuIds.includes(id));
        if (unavailableMenuIds.length > 0) {
            return res.status(status.BadRequest).json({
                message: `Some menu items are not available: ${unavailableMenuIds.join(', ')}`,
            });
        }

        const comboGroup = await db.ComboGroup.create(
            {
                id: uuidv4(),
                name,
                tenantId,
                isActive: '1',
                price: comboPrice,
                createdAt: new Date(),
            },
            { transaction }
        );

        const comboItems = items.map((item) => ({
            comboGroupId: comboGroup.id,
            menuId: item.menuId,
            quantity: item.quantity,
            type: item.type,
        }));

        await db.ComboGroupItem.bulkCreate(comboItems, { transaction });
        await logActivity(req, 'create', comboGroup);
        await transaction.commit();

        return res.status(status.OK).json({
            message: 'Combo offer created successfully',
            comboGroupId: comboGroup.id,
        });
    } catch (error) {
        await transaction.rollback();
        return res.status(status.InternalServerError).json({
            message: error.message,
        });
    }
};

exports.updateComboGroup = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        const { name, isActive, price } = req.body;

        const comboGroup = await db.ComboGroup.findOne({
            where: { id, tenantId: req.user.tenantId },
            transaction,
        });
        if (!comboGroup) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Combo group not found!' });
        }

        const oldData = JSON.parse(JSON.stringify(comboGroup.get({ plain: true })));

        if (typeof name !== 'undefined') comboGroup.name = name;
        if (typeof isActive !== 'undefined') comboGroup.isActive = isActive;
        if (typeof price !== 'undefined') comboGroup.price = price;
        comboGroup.updatedAt = new Date();

        await comboGroup.save({ transaction });
        await transaction.commit();

        await logActivity(req, 'update', comboGroup, oldData);

        return res.status(status.OK).json({
            message: 'Combo group updated successfully!',
            data: comboGroup,
        });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Update Combo Group API', req, res);
    }
};

exports.updateComboGroupItem = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        const { menuId, quantity, type } = req.body;

        const item = await db.ComboGroupItem.findOne({
            where: { id },
            include: [{ model: db.ComboGroup, as: 'ComboGroup', where: { tenantId: req.user.tenantId }, attributes: [] }],
            transaction,
        });
        if (!item) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Combo group item not found!' });
        }

        if (menuId !== undefined) {
            const menu = await db.Menu.findOne({ where: { id: menuId, tenantId: req.user.tenantId }, transaction });
            if (!menu) {
                await transaction.rollback();
                return res.status(status.NotFound).json({ message: 'Menu item not found' });
            }
        }

        if (typeof menuId !== 'undefined') item.menuId = menuId;
        if (typeof quantity !== 'undefined') item.quantity = quantity;
        if (typeof type !== 'undefined') item.type = type;

        await item.save({ transaction });
        await transaction.commit();

        return res.status(status.OK).json({
            message: 'Combo group item updated successfully!',
            data: item,
        });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Update Combo Group Item API', req, res);
    }
};

exports.addComboGroupItem = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { comboGroupId, menuId, quantity, type } = req.body;

        if (!comboGroupId || !menuId || !quantity || !type) {
            await transaction.rollback();
            return res.status(status.BadRequest).json({ message: 'All fields are required: comboGroupId, menuId, quantity, type' });
        }

        const comboGroup = await db.ComboGroup.findOne({ where: { id: comboGroupId, tenantId: req.user.tenantId } });
        if (!comboGroup) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Combo group not found' });
        }

        const menu = await db.Menu.findOne({
            where: {
                id: menuId,
                isAvailable: '1',
                tenantId: req.user.tenantId,
            },
        });

        if (!menu) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Menu item not found' });
        }

        const item = await db.ComboGroupItem.create(
            {
                comboGroupId,
                menuId,
                quantity,
                type,
                createdBy: req.user.id,
            },
            { transaction }
        );

        await transaction.commit();
        return res.status(status.OK).json({
            message: 'Combo group item added successfully!',
            data: item,
        });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Add Combo Group Item API', req, res);
    }
};
exports.deleteComboGroupItem = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;

        const item = await db.ComboGroupItem.findOne({
            where: { id },
            include: [{ model: db.ComboGroup, as: 'ComboGroup', where: { tenantId: req.user.tenantId }, attributes: [] }],
        });
        if (!item) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Combo group item not found' });
        }

        await item.destroy({ transaction });
        await transaction.commit();

        await logActivity(req, 'delete', item);

        return res.status(status.OK).json({ message: 'Combo group item deleted successfully' });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Delete Combo Group Item API', req, res);
    }
};
exports.deleteCombo = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;

        const combo = await db.ComboGroup.findOne({ where: { id, tenantId: req.user.tenantId }, transaction });
        if (!combo) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Combo not found' });
        }

        await db.ComboGroupItem.destroy({
            where: { comboGroupId: id },
            transaction,
        });

        await combo.destroy({ transaction });
        await transaction.commit();
        await logActivity(req, 'delete', combo);

        return res.status(status.OK).json({ message: 'Combo deleted successfully' });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Delete Combo API', req, res);
    }
};

exports.getAllCombos = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;

        if (!tenantId) {
            return res.status(status.BadRequest).json({
                message: 'Tenant ID not found in user context',
            });
        }

        const combos = await db.ComboGroup.findAll({
            where: { tenantId },
            attributes: ['id', 'name', 'isActive', 'price', 'createdAt', 'updatedAt'],
            include: [
                {
                    model: db.ComboGroupItem,
                    as: 'ComboGroupItems',
                    attributes: ['id', 'menuId', 'quantity', 'type'],
                    include: [
                        {
                            model: db.Menu,
                            as: 'Menu',
                            attributes: ['name'],
                        },
                    ],
                },
            ],
            order: [['createdAt', 'DESC']],
        });

        const formatted = combos.map((combo) => {
            const comboData = combo.toJSON();
            comboData.ComboGroupItems = comboData.ComboGroupItems.map((item) => ({
                id: item.id,
                menuId: item.menuId,
                quantity: item.quantity,
                type: item.type,
                name: item.Menu?.name || null,
            }));
            return comboData;
        });

        return res.status(status.OK).json({
            message: 'Combo items fetched successfully',
            data: formatted,
        });
    } catch (error) {
        return common.throwException(error, 'Get All Combos by Tenant API', req, res);
    }
};

exports.getComboById = async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.user.tenantId;

        if (!tenantId) {
            return res.status(status.BadRequest).json({
                message: 'Tenant ID not found in user context',
            });
        }

        const combo = await db.ComboGroup.findOne({
            where: {
                id,
                tenantId,
            },
            attributes: ['id', 'name', 'isActive', 'price', 'createdAt', 'updatedAt'],
            include: [
                {
                    model: db.ComboGroupItem,
                    as: 'ComboGroupItems',
                    attributes: ['id', 'menuId', 'quantity', 'type'],
                    include: [
                        {
                            model: db.Menu,
                            as: 'Menu',
                            attributes: ['name'],
                        },
                    ],
                },
            ],
        });

        if (!combo) {
            return res.status(status.NotFound).json({
                message: 'Combo not found for the given ID.',
            });
        }

        const comboData = combo.toJSON();
        comboData.ComboGroupItems = comboData.ComboGroupItems.map((item) => ({
            id: item.id,
            menuId: item.menuId,
            quantity: item.quantity,
            type: item.type,
            name: item.Menu?.name || null,
        }));

        return res.status(status.OK).json({
            message: 'Combo fetched successfully',
            data: comboData,
        });
    } catch (error) {
        return common.throwException(error, 'Get Combo By ID API', req, res);
    }
};

exports.updateComboStatus = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        if (isActive !== '1' && isActive !== '0') {
            await transaction.rollback();
            return res.status(status.BadRequest).json({ message: 'isActive must be a  value (0/1).' });
        }

        const combo = await db.ComboGroup.findOne({ where: { id, tenantId: req.user.tenantId }, transaction });

        if (!combo) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Combo group not found.' });
        }
        const oldData = JSON.parse(JSON.stringify(combo.get({ plain: true })));

        combo.isActive = isActive;
        combo.updatedBy = req.user.id;

        await combo.save({ transaction });
        await transaction.commit();

        await logActivity(req, 'update', combo, oldData);

        return res.status(status.OK).json({ message: 'Combo group status updated successfully.', data: combo });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Update Combo Status API', req, res);
    }
};

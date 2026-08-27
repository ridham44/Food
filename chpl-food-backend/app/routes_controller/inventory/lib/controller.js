const { status, common, findWithFilters } = require('../../../../utils');
const db = require('../../../db/models');
const { Op } = require('sequelize');
const logActivity = require('../../../../utils/lib/auditLog/activityLogger');

function computeStatus(currentStock, minimumLevel) {
    const stock = parseFloat(currentStock);
    const min = parseFloat(minimumLevel);
    if (stock <= 0) return 'out_of_stock';
    if (min > 0 && stock <= min * 0.5) return 'critical';
    if (min > 0 && stock <= min) return 'low';
    return 'good';
}

function withStatus(item) {
    const plain = item.get ? item.get({ plain: true }) : item;
    return { ...plain, status: computeStatus(plain.currentStock, plain.minimumLevel) };
}

exports.create = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { body, user } = req;
        if (!body.ingredientName || !body.unit) {
            await transaction.rollback();
            return res.status(status.BadRequest).json({ message: 'ingredientName and unit are required' });
        }

        const item = await db.InventoryItem.create(
            {
                tenantId: user.tenantId,
                ingredientName: body.ingredientName,
                category: body.category || null,
                unit: body.unit,
                currentStock: body.currentStock || 0,
                minimumLevel: body.minimumLevel || 0,
                createdBy: user.id,
            },
            { transaction }
        );

        await transaction.commit();
        await logActivity(req, 'create', item);
        return res.status(status.OK).json({ message: 'Inventory item created successfully!', data: withStatus(item) });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Create Inventory Item API', req, res);
    }
};

exports.update = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        const { body, user } = req;

        const item = await db.InventoryItem.findByPk(id);
        if (!item) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Inventory item not found!' });
        }

        const oldData = JSON.parse(JSON.stringify(item.get({ plain: true })));

        item.set({
            ingredientName: body.ingredientName ?? item.ingredientName,
            category: body.category ?? item.category,
            unit: body.unit ?? item.unit,
            minimumLevel: body.minimumLevel ?? item.minimumLevel,
            updatedBy: user.id,
        });

        await item.save({ transaction });
        await transaction.commit();
        await logActivity(req, 'update', item, oldData);
        return res.status(status.OK).json({ message: 'Inventory item updated successfully!', data: withStatus(item) });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Update Inventory Item API', req, res);
    }
};

exports.delete = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        const item = await db.InventoryItem.findByPk(id);
        if (!item) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Inventory item not found!' });
        }

        await db.InventoryMovement.destroy({ where: { inventoryItemId: id }, transaction });
        await db.InventoryItem.destroy({ where: { id }, transaction });
        await transaction.commit();
        await logActivity(req, 'delete', item);
        return res.status(status.OK).json({ message: 'Inventory item deleted successfully.' });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Delete Inventory Item API', req, res);
    }
};

exports.findById = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await db.InventoryItem.findByPk(id);
        if (!item) {
            return res.status(status.NotFound).json({ message: 'Inventory item not found!' });
        }
        return res.status(status.OK).json({ data: withStatus(item) });
    } catch (error) {
        return common.throwException(error, 'Find Inventory Item By ID', req, res);
    }
};

exports.movements = async (req, res) => {
    try {
        const { id } = req.params;
        const movements = await db.InventoryMovement.findAll({
            where: { inventoryItemId: id },
            order: [['createdAt', 'DESC']],
        });
        return res.status(status.OK).json({ data: movements });
    } catch (error) {
        return common.throwException(error, 'Find Inventory Movements', req, res);
    }
};

exports.filtration = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { body } = req;
        const filters = await findWithFilters.findWithFilters(body, db.InventoryItem);

        const whereCondition = { ...filters.filterCondition };
        if (body.search) {
            whereCondition.ingredientName = { [Op.like]: `%${body.search}%` };
        }
        if (body.category) {
            whereCondition.category = body.category;
        }

        const page = parseInt(body.page) || 1;
        const limit = parseInt(body.limit) || 20;
        const offset = (page - 1) * limit;

        const result = await db.InventoryItem.findAndCountAll({
            where: whereCondition,
            limit,
            offset,
            order: [['ingredientName', 'ASC']],
            transaction,
        });

        await transaction.commit();

        let rows = result.rows.map(withStatus);
        if (body.stockStatus) {
            rows = rows.filter((r) => r.status === body.stockStatus);
        }

        return res.status(status.OK).json({ data: { rows, count: result.count } });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Inventory Filter API', req, res);
    }
};

exports.updateStock = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id, type, quantity, note } = req.body;
        const user = req.user;

        if (!id || !['restock', 'usage', 'adjustment'].includes(type) || typeof quantity !== 'number') {
            await transaction.rollback();
            return res.status(status.BadRequest).json({ message: 'id, type (restock|usage|adjustment), and numeric quantity are required' });
        }

        const item = await db.InventoryItem.findByPk(id, { transaction });
        if (!item) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Inventory item not found!' });
        }

        const before = parseFloat(item.currentStock);
        let delta;
        if (type === 'restock') delta = Math.abs(quantity);
        else if (type === 'usage') delta = -Math.abs(quantity);
        else delta = quantity - before; // adjustment: quantity is the new absolute stock level

        const after = Math.max(0, before + delta);

        item.currentStock = after;
        item.updatedBy = user.id;
        await item.save({ transaction });

        const movement = await db.InventoryMovement.create(
            {
                tenantId: user.tenantId,
                inventoryItemId: id,
                type,
                quantity: (after - before).toFixed(2),
                note: note || null,
                createdBy: user.id,
            },
            { transaction }
        );

        await transaction.commit();
        await logActivity(req, 'update', item, { currentStock: before });
        return res.status(status.OK).json({ message: 'Stock updated successfully!', data: { item: withStatus(item), movement } });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Update Inventory Stock API', req, res);
    }
};

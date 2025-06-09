//const { Op } = require('sequelize');
const { status, common, findWithFilters } = require('../../../../utils');
const db = require('../../../db/models');

exports.create = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { parentId, name, price, filePath, tenantId } = req.body;
        const menu = await db.Menu.create(
            {
                parentId: parentId,
                name: name,
                price: price,
                filePath: filePath,
                tenantId: tenantId,
                createdBy: req.user.id,
            },
            { transaction }
        );

        await transaction.commit();
        return res.status(status.OK).json({ message: 'Menu created successfully!', data: menu });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Create Menu API', req, res);
    }
};

exports.update = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        const { parentId, name, price, filePath, tenantId } = req.body;

        const menu = await db.Menu.findByPk(id);
        if (!menu) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Menu not found!' });
        }

        menu.set({
            parentId: parentId,
            name: name,
            price: price,
            filePath: filePath,
            tenantId: tenantId,
            createdBy: req.user.id,
        });

        await menu.save({ transaction });
        await transaction.commit();
        return res.status(status.OK).json({ message: 'Menu updated successfully!', data: menu });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Update Menu API', req, res);
    }
};

exports.delete = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        const menu = await db.Menu.findByPk(id);
        if (!menu) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Menu not found!' });
        }

        const hasChildren = await db.Menu.findOne({ where: { parentId: id } });
        if (hasChildren) {
            return res.status(status.Conflict).json({ message: 'Menu has child entries and cannot be deleted.' });
        }

        await db.Menu.destroy({ where: { id }, transaction });
        await transaction.commit();
        return res.status(status.OK).json({ message: 'Menu deleted successfully.' });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Delete Menu API', req, res);
    }
};

exports.findById = async (req, res) => {
    try {
        const { id } = req.params;
        const menu = await db.Menu.findByPk(id);
        if (!menu) {
            return res.status(status.NotFound).json({ message: 'Menu not found!' });
        }
        return res.status(status.OK).json({ data: menu });
    } catch (error) {
        return common.throwException(error, 'Find Menu By ID', req, res);
    }
};

exports.findAll = async (req, res) => {
    try {
        const menus = await db.Menu.findAll({ order: [['createdAt', 'DESC']] });
        return res.status(status.OK).json({ data: menus });
    } catch (error) {
        return common.throwException(error, 'Find All Menus', req, res);
    }
};

exports.menuFiltration = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { body } = req;
        const filters = await findWithFilters.findWithFilters(body, db.Menu);

        const whereCondition = {
            tenantId: body.tenantId,
            ...filters.filterCondition,
        };

        const page = parseInt(body.page) || 1;
        const limit = parseInt(body.limit) || 10;
        const offset = (page - 1) * limit;

        const menus = await db.Menu.findAndCountAll({
            where: whereCondition,
            limit,
            offset,
            order: [['createdAt', 'DESC']],
            transaction,
        });

        await transaction.commit();
        return res.status(status.OK).json({ data: menus });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Menu Filter API', req, res);
    }
};

exports.menuForFilter = async (req, res) => {
    try {
        const data = [
            { value: 'name', label: 'Menu Name', type: 'text' },
            { value: 'price', label: 'Price', type: 'number' },
            { value: 'createdAt', label: 'Created At', type: 'date' },
        ];
        return res.status(status.OK).json({ data });
    } catch (error) {
        return common.throwException(error, 'Menu Filter Config', req, res);
    }
};

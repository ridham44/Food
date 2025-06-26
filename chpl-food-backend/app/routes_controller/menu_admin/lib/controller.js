const { Op } = require('sequelize');
const { status, common, findWithFilters } = require('../../../../utils');
const db = require('../../../db/models');

exports.create = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { name, url, sequence, type, parentId, key, status: statusValue } = req.body;

        const menu = await db.MenuAdmin.create(
            {
                name: name,
                url: url,
                sequence: sequence,
                type: type,
                parentId: parentId,
                key: key,
                status: statusValue,
                createdBy: req.user.id,
            },
            { transaction }
        );

        await transaction.commit();
        return res.status(status.OK).json({ message: 'Menu created successfully!', data: menu });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Create MenuAdmin API', req, res);
    }
};

exports.update = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        const { name, url, sequence, type, parentId, key, status: statusValue } = req.body;

        const menu = await db.MenuAdmin.findByPk(id, { transaction });
        if (!menu) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Menu not found!' });
        }
        await menu.set(
            {
                name: name,
                url: url,
                sequence: sequence,
                type: type,
                parentId: parentId,
                key: key,
                status: statusValue,
                updatedBy: req.user.id,
            },
            { transaction }
        );

        await transaction.commit();
        return res.status(status.OK).json({ message: 'Menu updated successfully!', data: menu });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Update MenuAdmin API', req, res);
    }
};

exports.delete = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;

        const menu = await db.MenuAdmin.findByPk(id, { transaction });
        if (!menu) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Menu not found!' });
        }

        await db.MenuAdmin.destroy({ where: { id }, transaction });
        await transaction.commit();
        return res.status(status.OK).json({ message: 'Menu deleted successfully.' });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Delete MenuAdmin API', req, res);
    }
};

exports.findById = async (req, res) => {
    try {
        const { id } = req.params;
        const menu = await db.MenuAdmin.findByPk(id);
        if (!menu) return res.status(status.NotFound).json({ message: 'Menu not found!' });
        return res.status(status.OK).json({ data: menu });
    } catch (error) {
        return common.throwException(error, 'Find MenuAdmin By ID API', req, res);
    }
};

exports.findAll = async (req, res) => {
    try {
        const menus = await db.MenuAdmin.findAll({ order: [['sequence', 'ASC']] });
        return res.status(status.OK).json({ data: menus });
    } catch (error) {
        return common.throwException(error, 'Find All MenuAdmins API', req, res);
    }
};

exports.updateStatus = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;

        const menu = await db.MenuAdmin.findByPk(id);
        if (!menu) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Invalid Menu ID!' });
        }

        menu.status = menu.status === '1' ? '0' : '1';
        await menu.save({ transaction });
        await transaction.commit();
        return res.status(status.OK).json({ message: 'Status updated successfully!' });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Update MenuAdmin Status API', req, res);
    }
};

exports.filtration = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { fromDate, toDate, page = 1, limit = 10, status: menuStatus } = req.body;

        let whereCondition = {};

        const filterData = await findWithFilters.findWithFilters(req.body, db.MenuAdmin);

        if (fromDate && toDate) {
            whereCondition.createdAt = {
                [Op.between]: [new Date(fromDate + ' 00:00:00'), new Date(toDate + ' 23:59:59')],
            };
        } else if (fromDate) {
            whereCondition.createdAt = { [Op.gte]: new Date(fromDate + ' 00:00:00') };
        } else if (toDate) {
            whereCondition.createdAt = { [Op.lte]: new Date(toDate + ' 23:59:59') };
        }

        if (menuStatus !== undefined) {
            whereCondition.status = menuStatus.toString();
        }

        whereCondition = { ...whereCondition, ...filterData.filterCondition };

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const result = await db.MenuAdmin.findAndCountAll({
            where: whereCondition,
            limit: parseInt(limit),
            offset,
            order: [['sequence', 'ASC']],
            transaction,
        });

        await transaction.commit();
        return res.status(status.OK).json({ data: result });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'MenuAdmin Filter API', req, res);
    }
};

exports.menuAdminForFilter = async (req, res) => {
    try {
        const data = [
            { value: 'name', label: 'Name', type: 'text' },
            { value: 'url', label: 'URL', type: 'text' },
            { value: 'status', label: 'Status', type: 'dropdown' },
            { value: 'createdAt', label: 'Created At', type: 'date' },
        ];
        return res.status(status.OK).json({ data });
    } catch (error) {
        return common.throwException(error, 'MenuAdmin Filter Options API', req, res);
    }
};

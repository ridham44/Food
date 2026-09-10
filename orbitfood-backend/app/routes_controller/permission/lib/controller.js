const { Op } = require('sequelize');
const { status, common, findWithFilters } = require('../../../../utils');
const db = require('../../../db/models');
const { v4: uuidv4 } = require('uuid');

exports.create = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { roleId, menu_adminIds } = req.body;  

        if (!Array.isArray(menu_adminIds) || menu_adminIds.length === 0) {
            await transaction.rollback();
            return res.status(status.BadRequest).json({
                message: 'menu_adminIds must be a non-empty array',
            });
        }

        const validMenus = await db.MenuAdmin.findAll({
            where: { id: menu_adminIds },
            attributes: ['id'],
            transaction,
        });

        const validMenuIds = validMenus.map(m => m.id);
        const invalidIds = menu_adminIds.filter(id => !validMenuIds.includes(id));

        if (invalidIds.length > 0) {
            await transaction.rollback();
            return res.status(status.BadRequest).json({
                message: `Invalid menu_adminIds: ${invalidIds.join(', ')}`,
            });
        }

        const existingPermissions = await db.Permission.findAll({
            where: {
                roleId,
                menu_adminId: menu_adminIds,
            },
            transaction,
        });

        const existingMenuIds = existingPermissions.map(p => p.menu_adminId);

        const newPermissions = menu_adminIds
            .filter(id => !existingMenuIds.includes(id))
            .map(menu_adminId => ({
                id: uuidv4(),
                roleId,
                menu_adminId,
                createdBy: req.user.id,
            }));

        if (newPermissions.length === 0) {
            await transaction.rollback();
            return res.status(status.Conflict).json({
                message: 'All selected permissions already exist for this role.',
            });
        }

        const created = await db.Permission.bulkCreate(newPermissions, { transaction });

        await transaction.commit();
        return res.status(status.OK).json({
            message: 'Permissions created successfully!',
            data: created,
        });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Bulk Create Permission API', req, res);
    }
};


exports.update = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        const { menu_adminId } = req.body;

        const permission = await db.Permission.findByPk(id, { transaction });
        if (!permission) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Permission not found!' });
        }

        await permission.set(
            {
                menu_adminId: menu_adminId,
                updatedBy: req.user.id,
            },
            { transaction }
        );

        await transaction.commit();
        return res.status(status.OK).json({ message: 'Permission updated successfully!', data: permission });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Update Permission API', req, res);
    }
};

exports.delete = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;

        const permission = await db.Permission.findByPk(id, { transaction });
        if (!permission) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Permission not found!' });
        }

        await db.Permission.destroy({ where: { id }, transaction });
        await transaction.commit();
        return res.status(status.OK).json({ message: 'Permission deleted successfully.' });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Delete Permission API', req, res);
    }
};

exports.findById = async (req, res) => {
    try {
        const { id } = req.params;
        const permission = await db.Permission.findByPk(id);
        if (!permission) return res.status(status.NotFound).json({ message: 'Permission not found!' });
        return res.status(status.OK).json({ data: permission });
    } catch (error) {
        return common.throwException(error, 'Find Permission By ID API', req, res);
    }
};

exports.findAll = async (req, res) => {
    try {
        const permissions = await db.Permission.findAll({ order: [['createdAt', 'DESC']] });
        return res.status(status.OK).json({ data: permissions });
    } catch (error) {
        return common.throwException(error, 'Find All Permissions API', req, res);
    }
};

exports.filtration = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { fromDate, toDate, page = 1, limit = 10 } = req.body;

        let whereCondition = {};

        const filterData = await findWithFilters.findWithFilters(req.body, db.Permission);

        if (fromDate && toDate) {
            whereCondition.createdAt = {
                [Op.between]: [new Date(fromDate + ' 00:00:00'), new Date(toDate + ' 23:59:59')],
            };
        } else if (fromDate) {
            whereCondition.createdAt = { [Op.gte]: new Date(fromDate + ' 00:00:00') };
        } else if (toDate) {
            whereCondition.createdAt = { [Op.lte]: new Date(toDate + ' 23:59:59') };
        }

        whereCondition = { ...whereCondition, ...filterData.filterCondition };

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const result = await db.Permission.findAndCountAll({
            where: whereCondition,
            limit: parseInt(limit),
            offset,
            order: [['createdAt', 'DESC']],
            transaction,
        });

        await transaction.commit();
        return res.status(status.OK).json({ data: result });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Permission Filter API', req, res);
    }
};

exports.permissionFilterOptions = async (req, res) => {
    try {
        const data = [
            { value: 'menu_adminId', label: 'Menu Admin ID', type: 'text' },
            { value: 'createdAt', label: 'Created At', type: 'date' },
        ];
        return res.status(status.OK).json({ data });
    } catch (error) {
        return common.throwException(error, 'Permission Filter Options API', req, res);
    }
};

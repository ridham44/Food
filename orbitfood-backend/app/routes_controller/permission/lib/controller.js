const { Op } = require('sequelize');
const { status, common, findWithFilters } = require('../../../../utils');
const db = require('../../../db/models');
const { v4: uuidv4 } = require('uuid');

// Permission has no tenantId column of its own — ownership is derived
// transitively through Permission.roleId -> Role.tenantId. Every handler
// below must join through Role to confirm the caller's own tenant owns the
// role being granted/read/changed, or a tenant user could read/write another
// tenant's entire permission matrix by roleId/permission id alone.
const isPlatformAdmin = (user) => user?.Role?.type === '1';

exports.create = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { roleId, menu_adminIds } = req.body;

        if (!roleId) {
            await transaction.rollback();
            return res.status(status.BadRequest).json({ message: 'roleId is required' });
        }

        if (!Array.isArray(menu_adminIds) || menu_adminIds.length === 0) {
            await transaction.rollback();
            return res.status(status.BadRequest).json({
                message: 'menu_adminIds must be a non-empty array',
            });
        }

        const roleScopeWhere = isPlatformAdmin(req.user) ? { id: roleId } : { id: roleId, tenantId: req.user.tenantId };
        const role = await db.Role.findOne({ where: roleScopeWhere, transaction });
        if (!role) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Role not found!' });
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

        const permission = await db.Permission.findByPk(id, {
            include: [{ model: db.Role, as: 'Role', attributes: ['id', 'tenantId'], disableTenantCheck: true }],
            transaction,
        });
        if (!permission || (!isPlatformAdmin(req.user) && permission.Role?.tenantId !== req.user.tenantId)) {
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

        const permission = await db.Permission.findByPk(id, {
            include: [{ model: db.Role, as: 'Role', attributes: ['id', 'tenantId'], disableTenantCheck: true }],
            transaction,
        });
        if (!permission || (!isPlatformAdmin(req.user) && permission.Role?.tenantId !== req.user.tenantId)) {
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
        const permission = await db.Permission.findByPk(id, {
            include: [{ model: db.Role, as: 'Role', attributes: ['id', 'tenantId'], disableTenantCheck: true }],
        });
        if (!permission || (!isPlatformAdmin(req.user) && permission.Role?.tenantId !== req.user.tenantId)) {
            return res.status(status.NotFound).json({ message: 'Permission not found!' });
        }
        return res.status(status.OK).json({ data: permission });
    } catch (error) {
        return common.throwException(error, 'Find Permission By ID API', req, res);
    }
};

exports.findAll = async (req, res) => {
    try {
        const roleWhere = isPlatformAdmin(req.user) ? {} : { tenantId: req.user.tenantId };
        const permissions = await db.Permission.findAll({
            include: [{ model: db.Role, as: 'Role', attributes: ['id', 'name', 'tenantId'], where: roleWhere, required: true, disableTenantCheck: true }],
            order: [['createdAt', 'DESC']],
        });
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

        const roleWhere = isPlatformAdmin(req.user) ? {} : { tenantId: req.user.tenantId };

        const result = await db.Permission.findAndCountAll({
            where: whereCondition,
            include: [{ model: db.Role, as: 'Role', attributes: ['id', 'name', 'tenantId'], where: roleWhere, required: true, disableTenantCheck: true }],
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

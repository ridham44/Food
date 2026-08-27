const { Op } = require('sequelize');
const { status, common, dbCommon, findWithFilters } = require('../../../../utils');
const db = require('../../../db/models');
const logActivity = require('../../../../utils/lib/auditLog/activityLogger');

exports.create = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { body, user } = req;

        const role = await db.Role.create(
            {
                name: body.name,
                type: body.type,
                isAdmin: body.isAdmin,
                remark: body.remark,
                status: body.statusValue,
                tenantId: user.tenantId,
                createdBy: user.id,
            },
            { transaction }
        );
        await logActivity(req, 'create', role);
        await transaction.commit();
        return res.status(status.OK).json({ message: 'Role added successfully!', data: role });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Create Role Api', req, res);
    }
};

exports.update = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { body, user } = req;
        const { id } = req.params;

        const role = await db.Role.findByPk(id, { transaction });
        if (!role) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Role not found!' });
        }

        const duplicate = await db.Role.findOne({
            where: {
                id: { [Op.ne]: id },
                name: body.name,
            },
        });

        if (duplicate) {
            await transaction.rollback();
            return res.status(status.Conflict).json({ message: 'Role with this name already exists.' });
        }
        const oldData = JSON.parse(JSON.stringify(role.get({ plain: true })));
        role.set({
            name: body.name,
            type: body.type,
            isAdmin: body.isAdmin,
            remark: body.remark,
            status: body.status,
            tenantId: user.tenantId,
            updatedBy: user.id,
        });

        await role.save({ transaction });
        await transaction.commit();
        await logActivity(req, 'update', role, oldData);
        return res.status(status.OK).json({ message: 'Role updated successfully!', data: role });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Update Role Api', req, res);
    }
};

exports.delete = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;

        const role = await db.Role.findByPk(id, { transaction });
        if (!role) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Role not found!' });
        }

        const hasChildren = await dbCommon.hasAnyChildren(role);
        if (hasChildren.hasChildren) {
            return res.status(status.Conflict).json({ message: hasChildren.message });
        }
        await db.Role.destroy({ where: { id: id }, transaction });
        await transaction.commit();
        await logActivity(req, 'delete', role);
        return res.status(status.OK).json({ message: 'Role deleted successfully.' });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Delete Role Api', req, res);
    }
};

exports.findById = async (req, res) => {
    try {
        const { id } = req.params;
        const role = await db.Role.findByPk(id);
        if (!role) return res.status(status.NotFound).json({ message: 'Role not found!' });
        return res.status(status.OK).json({ data: role });
    } catch (error) {
        return common.throwException(error, 'Find Role By ID', req, res);
    }
};

exports.findAll = async (req, res) => {
    try {
        // Role.hasTenantCondition(false) — this model isn't auto-scoped, and this
        // query had no manual tenantId filter at all, so any tenant user could
        // see (and, from the Staff form, assign) every other tenant's custom
        // roles. Platform admins still see everything; tenant users only see
        // their own.
        const isPlatformAdmin = req.user?.Role?.type === '1';
        const where = isPlatformAdmin ? {} : { tenantId: req.user.tenantId };
        const roles = await db.Role.findAll({ where, order: [['createdAt', 'DESC']] });
        return res.status(status.OK).json({ data: roles });
    } catch (error) {
        return common.throwException(error, 'Find All Roles', req, res);
    }
};

exports.updateStatus = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        const role = await db.Role.findByPk(id);
        if (!role) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Invalid role ID!' });
        }
        const oldData = JSON.parse(JSON.stringify(role.get({ plain: true })));
        role.status = role.status === '1' ? '0' : '1';
        await role.save({ transaction });
        await transaction.commit();
        await logActivity(req, 'update', role, oldData);
        return res.status(status.OK).json({ message: 'Status updated successfully!' });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Update Role Status Api', req, res);
    }
};

exports.roleFiltration = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { body } = req;

        const filters = await findWithFilters.findWithFilters(body, db.Role);
        const whereCondition = {
            tenantId: body.tenantId, // optional
            ...filters.filterCondition,
        };

        const page = parseInt(body.page) || 1;
        const limit = parseInt(body.limit) || 10;
        const offset = (page - 1) * limit;

        const roles = await db.Role.findAndCountAll({
            where: whereCondition,
            limit,
            offset,
            order: [['createdAt', 'DESC']],
            transaction,
        });

        await transaction.commit();
        return res.status(status.OK).json({ data: roles });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Role Filter API', req, res);
    }
};

exports.roleForFilter = async (req, res) => {
    try {
        const data = [
            { value: 'name', label: 'Role Name', type: 'text' },
            { value: 'type', label: 'Type', type: 'dropdown' },
            { value: 'status', label: 'Status', type: 'dropdown' },
            { value: 'createdAt', label: 'Created At', type: 'date' },
        ];
        return res.status(status.OK).json({ data });
    } catch (error) {
        return common.throwException(error, 'Role Filter Config', req, res);
    }
};

exports.filtration = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { fromDate, toDate, page = 1, limit = 10, isAdmin, type, status: roleStatus } = req.body;

        if ((fromDate && isNaN(Date.parse(fromDate))) || (toDate && isNaN(Date.parse(toDate)))) {
            return res.status(status.BadRequest).json({
                message: 'Invalid date format. Please use YYYY-MM-DD format for fromDate and toDate.',
            });
        }

        if (isAdmin !== undefined && isAdmin !== 0 && isAdmin !== 1 && isAdmin !== '0' && isAdmin !== '1') {
            return res.status(status.BadRequest).json({
                message: 'isAdmin must be either 0 or 1.',
            });
        }

        if (type !== undefined && !['1', '2', '3', 1, 2, 3].includes(type)) {
            return res.status(status.BadRequest).json({
                message: 'type must be 1 (AdminUser), 2 (Tenant), or 3 (Customer).',
            });
        }

        if (roleStatus !== undefined && roleStatus !== 0 && roleStatus !== 1 && roleStatus !== '0' && roleStatus !== '1') {
            return res.status(status.BadRequest).json({
                message: 'status must be either 0 or 1.',
            });
        }

        let whereCondition = {};
        let roleFilter = {};

        if (req.body) {
            roleFilter = await findWithFilters.findWithFilters(req.body, db.Role);
        }

        if (fromDate && toDate) {
            whereCondition.createdAt = {
                [Op.between]: [new Date(fromDate + ' 00:00:00'), new Date(toDate + ' 23:59:59')],
            };
        } else if (fromDate) {
            whereCondition.createdAt = {
                [Op.gte]: new Date(fromDate + ' 00:00:00'),
            };
        } else if (toDate) {
            whereCondition.createdAt = {
                [Op.lte]: new Date(toDate + ' 23:59:59'),
            };
        }

        if (isAdmin !== undefined) {
            whereCondition.isAdmin = parseInt(isAdmin);
        }

        if (type !== undefined) {
            whereCondition.type = type.toString();
        }

        if (roleStatus !== undefined) {
            whereCondition.status = roleStatus.toString();
        }

        whereCondition = {
            ...whereCondition,
            ...roleFilter.filterCondition,
        };

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const roles = await db.Role.findAndCountAll({
            where: whereCondition,
            limit: parseInt(limit),
            offset: offset,
            order: [['createdAt', 'DESC']],
            transaction,
        });

        await transaction.commit();
        return res.status(status.OK).json({ data: roles });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Role Date Filter API', req, res);
    }
};

const { Op } = require('sequelize');
const { status, common, dbCommon, findWithFilters } = require('../../../../utils');
const db = require('../../../db/models');

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

        role.set({
            name: body.name,
            type: body.type,
            isAdmin: body.isAdmin,
            remark: body.remark,
            status: body.status,
            tenantId: user.tenantId,
            createdBy: user.id,
        });

        await role.save({ transaction });
        await transaction.commit();
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

        await db.Role.destroy({ where: { id }, transaction });
        await transaction.commit();
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
        const roles = await db.Role.findAll({ order: [['createdAt', 'DESC']] });
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

        role.status = role.status === '1' ? '0' : '1';
        await role.save({ transaction });
        await transaction.commit();
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

exports.dateFiltration = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { body } = req;
        const { fromDate, toDate, page = 1, limit = 10 } = body;

        if ((fromDate && isNaN(Date.parse(fromDate))) || (toDate && isNaN(Date.parse(toDate)))) {
            return res.status(status.BadRequest).json({
                message: 'Invalid date format. Please use YYYY-MM-DD format for fromDate and toDate.',
            });
        }

        let whereCondition = {};
        let roleFilter = {};

        if (body) {
            roleFilter = await findWithFilters.findWithFilters(body, db.Role);
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

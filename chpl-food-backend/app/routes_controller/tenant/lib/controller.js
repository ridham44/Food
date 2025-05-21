const { status, common, dbCommon, findWithFilters } = require('../../../../utils');
const db = require('../../../db/models');

exports.create = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const payload = req.body;
        payload.createdBy = req.user.id;

        const tenant = await db.Tenant.create(payload, { transaction });
        await transaction.commit();

        return res.status(status.OK).json({ message: 'Tenant created successfully', data: tenant });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Create Tenant', req, res);
    }
};

exports.update = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        const payload = req.body;

        const tenant = await db.Tenant.findByPk(id);
        if (!tenant) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Tenant not found' });
        }

        payload.updatedBy = req.user.id;
        tenant.set(payload);
        await tenant.save({ transaction });
        await transaction.commit();

        return res.status(status.OK).json({ message: 'Tenant updated successfully', data: tenant });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Update Tenant', req, res);
    }
};

exports.delete = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        const tenant = await db.Tenant.findByPk(id);
        if (!tenant) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Tenant not found' });
        }

        const hasChildren = await dbCommon.hasAnyChildren(tenant);
        if (hasChildren.hasChildren) {
            return res.status(status.Conflict).json({ message: hasChildren.message });
        }

        await db.Tenant.destroy({ where: { id }, transaction });
        await transaction.commit();

        return res.status(status.OK).json({ message: 'Tenant deleted successfully' });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Delete Tenant', req, res);
    }
};

exports.findById = async (req, res) => {
    try {
        const { id } = req.params;
        const tenant = await db.Tenant.findByPk(id);
        if (!tenant) return res.status(status.NotFound).json({ message: 'Tenant not found' });

        return res.status(status.OK).json({ data: tenant });
    } catch (error) {
        return common.throwException(error, 'Find Tenant By ID', req, res);
    }
};

exports.findAll = async (req, res) => {
    try {
        console.log('findAll tenant called');   
        const tenants = await db.Tenant.findAll({ order: [['createdAt', 'DESC']] });
        return res.status(status.OK).json({ data: tenants });
    } catch (error) {
        return common.throwException(error, 'Find All Tenants', req, res);
    }
};

exports.tenantFiltration = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { body } = req;
        const filters = await findWithFilters.findWithFilters(body, db.Tenant);
        const whereCondition = { ...filters.filterCondition };
        const page = parseInt(body.page) || 1;
        const limit = parseInt(body.limit) || 10;
        const offset = (page - 1) * limit;

        const tenants = await db.Tenant.findAndCountAll({
            where: whereCondition,
            limit,
            offset,
            order: [['createdAt', 'DESC']],
            transaction,
        });

        await transaction.commit();
        return res.status(status.OK).json({ data: tenants });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Tenant Filter', req, res);
    }
};

exports.tenantForFilter = async (req, res) => {
    try {
        const data = [
            { value: 'shortCode', label: 'Short Code', type: 'text' },
            { value: 'companyName', label: 'Company Name', type: 'text' },
            { value: 'status', label: 'Status', type: 'dropdown' },
            { value: 'createdAt', label: 'Created At', type: 'date' },
        ];
        return res.status(status.OK).json({ data });
    } catch (error) {
        return common.throwException(error, 'Tenant Filter Config', req, res);
    }
};

exports.updateStatus = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        const { status: newStatus } = req.body;

        const tenant = await db.Tenant.findByPk(id);
        if (!tenant) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Tenant not found' });
        }

        tenant.status = newStatus;
        tenant.updatedBy = req.user.id;
        await tenant.save({ transaction });

        await transaction.commit();
        return res.status(status.OK).json({ message: 'Status updated successfully', data: tenant });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Update Status', req, res);
    }
};

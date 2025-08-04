const { status, common, dbCommon } = require('../../../../utils');
const db = require('../../../db/models');
const logActivity = require('../../../../utils/lib/auditLog/activityLogger');

exports.create = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { gst, packingFee, status: statusValue } = req.body;
        const tenantId = req.user.tenantId;

        const tax = await db.TaxConfig.create(
            {
                tenantId,
                gst,
                packingFee,
                status: statusValue,
                createdAt: Date.now(),
            },
            { transaction }
        );

        await logActivity(req, 'create', tax);
        await transaction.commit();
        return res.status(status.OK).json({ message: 'Tax configuration created successfully!', data: tax });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Create TaxConfig API', req, res);
    }
};

exports.update = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { gst, packingFee, status: statusValue } = req.body;
        const tenantId = req.user.tenantId;
        const { id } = req.params;

        const tax = await db.TaxConfig.findByPk(id, { transaction });
        if (!tax) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Tax config not found!' });
        }

        const oldData = JSON.parse(JSON.stringify(tax.get({ plain: true })));

        tax.set({
            tenantId,
            gst,
            packingFee,
            status: statusValue,
            updatedAt: Date.now(),
        });

        await tax.save({ transaction });
        await transaction.commit();
        await logActivity(req, 'update', tax, oldData);
        return res.status(status.OK).json({ message: 'Tax configuration updated successfully!', data: tax });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Update TaxConfig API', req, res);
    }
};

exports.delete = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;

        const tax = await db.TaxConfig.findByPk(id, { transaction });
        if (!tax) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Tax config not found!' });
        }

        const hasChildren = await dbCommon.hasAnyChildren(tax);
        if (hasChildren.hasChildren) {
            return res.status(status.Conflict).json({ message: hasChildren.message });
        }

        await db.TaxConfig.destroy({ where: { id } });
        await transaction.commit();
        await logActivity(req, 'delete', tax);
        return res.status(status.OK).json({ message: 'Tax configuration deleted successfully.' });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Delete TaxConfig API', req, res);
    }
};

exports.findById = async (req, res) => {
    try {
        const { id } = req.params;
        const tax = await db.TaxConfig.findByPk(id);
        if (!tax) return res.status(status.NotFound).json({ message: 'Tax config not found!' });
        return res.status(status.OK).json({ data: tax });
    } catch (error) {
        return common.throwException(error, 'Find TaxConfig By ID', req, res);
    }
};

exports.findAll = async (req, res) => {
    try {
        const taxes = await db.TaxConfig.findAll({ order: [['createdAt', 'DESC']] });
        return res.status(status.OK).json({ data: taxes });
    } catch (error) {
        return common.throwException(error, 'Find All TaxConfigs', req, res);
    }
};

exports.updateStatus = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        const tax = await db.TaxConfig.findByPk(id);
        if (!tax) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Invalid tax config ID!' });
        }
        const oldData = JSON.parse(JSON.stringify(tax.get({ plain: true })));

        tax.status = tax.status === '1' ? '0' : '1';
        await tax.save({ transaction });
        await transaction.commit();
        await logActivity(req, 'update', tax, oldData);
        return res.status(status.OK).json({ message: 'Status updated successfully!' });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Update TaxConfig Status API', req, res);
    }
};

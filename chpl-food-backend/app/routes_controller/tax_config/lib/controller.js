const { status, common, dbCommon } = require('../../../../utils');
const db = require('../../../db/models');
const logActivity = require('../../../../utils/lib/auditLog/activityLogger');
const { Op, fn, col, literal } = require('sequelize');

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

        const tax = await db.TaxConfig.findOne({ where: { id, tenantId }, transaction });
        if (!tax) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Tax config not found!' });
        }

        const oldData = JSON.parse(JSON.stringify(tax.get({ plain: true })));

        tax.set({
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

        const tax = await db.TaxConfig.findOne({ where: { id, tenantId: req.user.tenantId }, transaction });
        if (!tax) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Tax config not found!' });
        }

        const hasChildren = await dbCommon.hasAnyChildren(tax);
        if (hasChildren.hasChildren) {
            return res.status(status.Conflict).json({ message: hasChildren.message });
        }

        await db.TaxConfig.destroy({ where: { id, tenantId: req.user.tenantId } });
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
        const tax = await db.TaxConfig.findOne({ where: { id, tenantId: req.user.tenantId } });
        if (!tax) return res.status(status.NotFound).json({ message: 'Tax config not found!' });
        return res.status(status.OK).json({ data: tax });
    } catch (error) {
        return common.throwException(error, 'Find TaxConfig By ID', req, res);
    }
};

exports.findAll = async (req, res) => {
    try {
        const taxes = await db.TaxConfig.findAll({
            where: { tenantId: req.user.tenantId },
            order: [['createdAt', 'DESC']],
        });
        return res.status(status.OK).json({ data: taxes });
    } catch (error) {
        return common.throwException(error, 'Find All TaxConfigs', req, res);
    }
};

exports.updateStatus = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        const tax = await db.TaxConfig.findOne({ where: { id, tenantId: req.user.tenantId } });
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

exports.getAllTenantTaxReport = async (req, res) => {
    try {
        const user = req.user;
        const userRoleId = user.roleId;

        const role = await db.Role.findOne({
            where: { id: userRoleId },
            attributes: ['isAdmin'],
            raw: true,
        });

        if (!role || role.isAdmin !== 1) {
            return res.status(status.Forbidden).json({
                status: false,
                message: 'Admin/Superadmin access required to view all tenant tax reports.',
            });
        }

        const configs = await db.TaxConfig.findAll({
            include: [
                {
                    model: db.Tenant,
                    attributes: ['companyName'],
                    as: 'Tenant',
                    disabletenantCondition: true,
                },
            ],
            order: [['createdAt', 'DESC']],
        });

        const result = configs.map((cfg) => ({
            tenantName: cfg.Tenant?.companyName || 'N/A',
            gst: cfg.gst,
            packingFee: cfg.packingFee,
            status: cfg.status === '1' ? 'Active' : 'Inactive',
        }));

        return res.status(status.OK).json({
            status: true,
            message: 'Current tax configurations',
            data: result,
        });
    } catch (error) {
        console.error('Error in getAllTenantTaxReport:', error.message);
        return res.status(status.InternalServerError).json({
            status: false,
            message: 'Failed to generate tax policy report',
        });
    }
};

exports.getTenantTaxSummary = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { fromDate, toDate } = req.body;

        if (!fromDate || !toDate) {
            return res.status(status.BadRequest).json({
                status: false,
                message: 'fromDate and toDate are required',
            });
        }

        const taxSummary = await db.OrderBill.findOne({
            attributes: [
                [fn('COUNT', col('OrderBill.id')), 'totalOrders'],
                [fn('SUM', literal('(OrderBill.totalAmount * OrderBill.gstPercent / 100)')), 'totalGstCollected'],
                [fn('SUM', col('OrderBill.packingFee')), 'totalPackingFeeCollected'],
            ],
            include: [
                {
                    model: db.OrderList,
                    as: 'OrderList',
                    attributes: [],
                    where: {
                        tenantId,
                    },
                },
            ],
            where: {
                createdAt: {
                    [Op.between]: [new Date(fromDate), new Date(toDate)],
                },
            },
            raw: true,
        });

        const tenant = await db.Tenant.findByPk(tenantId);

        return res.status(status.OK).json({
            status: true,
            message: 'Tax summary report generated successfully',
            data: {
                tenant: tenant?.companyName || 'N/A',
                fromDate,
                toDate,
                totalOrders: Number(taxSummary?.totalOrders || 0),
                totalGstCollected: Number(taxSummary?.totalGstCollected || 0),
                totalPackingFeeCollected: Number(taxSummary?.totalPackingFeeCollected || 0),
            },
        });
    } catch (error) {
        console.error('Error in getTenantTaxSummary:', error.message);
        return res.status(status.InternalServerError).json({
            status: false,
            message: 'Failed to generate tax summary report',
        });
    }
};

exports.getPackingFeeSummary = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { fromDate, toDate } = req.body;

        if (!fromDate || !toDate) {
            return res.status(status.BadRequest).json({
                status: false,
                message: 'fromDate and toDate are required',
            });
        }

        const result = await db.OrderBill.findOne({
            attributes: [
                [fn('COUNT', col('OrderBill.id')), 'totalOrders'],
                [fn('SUM', col('OrderBill.packingFee')), 'totalPackingFeeCollected'],
            ],
            include: [
                {
                    model: db.OrderList,
                    as: 'OrderList',
                    attributes: [],
                    where: {
                        tenantId,
                    },
                },
            ],
            where: {
                createdAt: {
                    [Op.between]: [new Date(fromDate), new Date(toDate)],
                },
            },
            raw: true,
        });

        const tenant = await db.Tenant.findByPk(tenantId);

        return res.status(status.OK).json({
            status: true,
            message: 'Packing fee summary generated successfully',
            data: {
                tenant: tenant?.companyName || 'N/A',
                fromDate,
                toDate,
                totalOrders: Number(result?.totalOrders || 0),
                totalPackingFeeCollected: Number(result?.totalPackingFeeCollected || 0),
            },
        });
    } catch (error) {
        console.error('Error in getPackingFeeSummary:', error.message);
        return res.status(status.InternalServerError).json({
            status: false,
            message: 'Failed to generate packing fee summary report',
        });
    }
};

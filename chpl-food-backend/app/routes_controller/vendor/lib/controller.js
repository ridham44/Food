const { status, common } = require('../../../../utils');
const db = require('../../../db/models');
const logActivity = require('../../../../utils/lib/auditLog/activityLogger');
const { Op } = require('sequelize');

exports.createVendor = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const tenantId = req.user.tenantId;
        const { name, contactPerson, phone, email, address, note, items } = req.body;

        if (!tenantId || !name || !Array.isArray(items) || items.length === 0) {
            return res.status(status.BadRequest).json({ message: 'tenantId, name, and at least one item are required' });
        }

        const now = new Date();

        const vendor = await db.Vendor.create(
            {
                name,
                contactPerson,
                phone,
                email,
                address,
                note,
                tenantId,
                status: '1',
                createdAt: now,
            },
            { transaction }
        );

        const vendorItems = items
            .map((item) => {
                if (!item.ingredientName || !item.unit || typeof item.costPerUnit !== 'number') return null;

                return {
                    vendorId: vendor.id,
                    ingredientName: item.ingredientName,
                    costPerUnit: item.costPerUnit,
                    unit: item.unit,
                    category: item.category || null,
                    status: true,
                    createdAt: now,
                };
            })
            .filter(Boolean);

        if (vendorItems.length === 0) {
            await transaction.rollback();
            return res.status(status.BadRequest).json({ message: 'All items must have ingredientName, costPerUnit (number), and unit' });
        }

        await db.VendorItem.bulkCreate(vendorItems, { transaction });
        await transaction.commit();

        await logActivity(req, 'create', vendor);

        return res.status(status.OK).json({
            message: 'Vendor created successfully',
            data: {
                ...vendor.toJSON(),
                items: vendorItems,
            },
        });
    } catch (err) {
        await transaction.rollback();
        console.error('Create Vendor Error:', err.message);
        return res.status(status.InternalServerError).json({ message: 'Something went wrong', error: err.message });
    }
};

exports.getAllVendors = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;

        const vendors = await db.Vendor.findAll({
            where: { tenantId },
            order: [['createdAt', 'DESC']],
        });

        return res.status(status.OK).json({ message: 'Vendor list fetched', data: vendors });
    } catch (err) {
        console.error('Get Vendor Error:', err.message);
        return res.status(status.InternalServerError).json({ message: 'Something went wrong', error: err });
    }
};

exports.updateVendor = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id: vendorId } = req.params;
        const tenantId = req.user.tenantId;

        const vendor = await db.Vendor.findOne({
            where: { id: vendorId, tenantId },
            transaction,
        });

        if (!vendor) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Vendor not found' });
        }

        const oldData = JSON.parse(JSON.stringify(vendor.get({ plain: true })));

        vendor.set({
            ...req.body,
            updatedAt: new Date(),
        });

        await vendor.save({ transaction });
        await transaction.commit();

        await logActivity(req, 'update', vendor, oldData);

        return res.status(status.OK).json({
            message: 'Vendor updated successfully',
            data: vendor,
        });
    } catch (err) {
        await transaction.rollback();
        console.error('Update Vendor Error:', err.message);
        return res.status(status.InternalServerError).json({
            message: 'Something went wrong',
            error: err.message,
        });
    }
};
exports.getVendorById = async (req, res) => {
    try {
        const { id } = req.params;

        const vendor = await db.Vendor.findByPk(id, {
            include: [{ model: db.VendorItem, as: 'VendorItems' }],
        });

        if (!vendor) {
            return res.status(status.NotFound).json({ message: 'Vendor not found' });
        }

        return res.status(status.OK).json({ message: 'Vendor fetched successfully', data: vendor });
    } catch (err) {
        console.error('Get Vendor by ID Error:', err.message);
        return res.status(status.InternalServerError).json({ message: 'Something went wrong', error: err.message });
    }
};

exports.deleteVendor = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const vendorId = req.params.id;
        const tenantId = req.user.tenantId;

        const vendor = await db.Vendor.findOne({
            where: { id: vendorId, tenantId },
            transaction,
        });

        if (!vendor) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Vendor not found' });
        }

        await db.VendorItem.destroy({
            where: { vendorId },
            transaction,
        });

        const oldData = JSON.parse(JSON.stringify(vendor.get({ plain: true })));

        await vendor.destroy({ transaction });

        await transaction.commit();
        await logActivity(req, 'delete', null, oldData);

        return res.status(status.OK).json({ message: 'Vendor and associated items deleted successfully' });
    } catch (err) {
        await transaction.rollback();
        console.error('Delete Vendor Error:', err.message);
        return res.status(status.InternalServerError).json({ message: 'Something went wrong', error: err.message });
    }
};

exports.updateVendorStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status: newStatus } = req.body;

        const item = await db.Vendor.findByPk(id);
        if (!item) {
            return res.status(status.NotFound).json({ message: 'Vendor item not found' });
        }

        item.status = newStatus;
        await item.save();

        res.status(status.OK).json({ message: 'Status updated successfully', data: item });
    } catch (err) {
        console.error(err.message);
        res.status(status.InternalServerError).json({ message: common.somethingWentWrong });
    }
};

exports.createVendorItem = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const { vendorId, ingredientName, costPerUnit, unit, category } = req.body;

        const vendor = await db.Vendor.findByPk(vendorId, { transaction });
        if (!vendor) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Vendor not found' });
        }

        const item = await db.VendorItem.create(
            {
                vendorId,
                ingredientName,
                costPerUnit,
                unit,
                category,
                status: 1,
                createdAt: new Date(),
            },
            { transaction }
        );

        await logActivity(req, 'create', item, transaction);

        await transaction.commit();
        return res.status(status.OK).json({ message: 'Vendor item created successfully', data: item });
    } catch (err) {
        await transaction.rollback();
        console.error('Create Vendor Item Error:', err.message);
        return res.status(status.InternalServerError).json({ message: 'Something went wrong', error: err.message });
    }
};

exports.getVendorItemById = async (req, res) => {
    try {
        const { id } = req.params;

        const item = await db.VendorItem.findOne({
            where: { id },
            include: [{ model: db.Vendor, as: 'Vendor', where: { tenantId: req.user.tenantId }, attributes: [] }],
        });
        if (!item) {
            return res.status(status.NotFound).json({ message: 'Vendor item not found' });
        }

        return res.status(status.OK).json({ data: item });
    } catch (err) {
        console.error('Get Vendor Item Error:', err.message);
        return res.status(status.InternalServerError).json({ message: 'Something went wrong', error: err.message });
    }
};

exports.updateVendorItem = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        const { ingredientName, costPerUnit, unit, category } = req.body;

        const item = await db.VendorItem.findOne({
            where: { id },
            include: [{ model: db.Vendor, as: 'Vendor', where: { tenantId: req.user.tenantId }, attributes: [] }],
            transaction,
        });
        if (!item) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Vendor item not found' });
        }

        const oldData = JSON.parse(JSON.stringify(item.get({ plain: true })));

        item.ingredientName = ingredientName ?? item.ingredientName;
        item.costPerUnit = costPerUnit ?? item.costPerUnit;
        item.unit = unit ?? item.unit;
        item.category = category ?? item.category;
        item.updatedAt = new Date();

        await item.save({ transaction });
        await transaction.commit();

        await logActivity(req, 'update', item, oldData);

        return res.status(status.OK).json({
            message: 'Vendor item updated successfully',
            data: item,
        });
    } catch (err) {
        await transaction.rollback();
        console.error('Update Vendor Item Error:', err.message);
        return res.status(status.InternalServerError).json({
            message: 'Something went wrong',
            error: err.message,
        });
    }
};

exports.deleteVendorItem = async (req, res) => {
    try {
        const { id } = req.params;

        const item = await db.VendorItem.findOne({
            where: { id },
            include: [{ model: db.Vendor, as: 'Vendor', where: { tenantId: req.user.tenantId }, attributes: [] }],
        });
        if (!item) {
            return res.status(status.NotFound).json({ message: 'Vendor item not found' });
        }

        await item.destroy();
        await logActivity(req, 'delete', item);

        return res.status(status.OK).json({ message: 'Vendor item deleted successfully' });
    } catch (err) {
        console.error('Delete Vendor Item Error:', err.message);
        return res.status(status.InternalServerError).json({ message: 'Something went wrong', error: err.message });
    }
};

exports.getAllVendorItemsForVendor = async (req, res) => {
    try {
        const { id } = req.params;
        const vendorId = id;
        const vendor = await db.Vendor.findByPk(vendorId);
        if (!vendor) {
            return res.status(status.NotFound).json({ message: 'Vendor not found' });
        }

        const items = await db.VendorItem.findAll({
            where: { vendorId },
            order: [['createdAt', 'DESC']],
        });

        return res.status(status.OK).json({ data: items });
    } catch (err) {
        console.error('Get All Vendor Items Error:', err.message);
        return res.status(status.InternalServerError).json({ message: 'Something went wrong', error: err.message });
    }
};

exports.vendorSummaryReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        let start = null;
        let end = null;

        if (startDate) {
            const parts = startDate.split('/');
            if (parts.length === 3) start = new Date(`${parts[0]}-${parts[1]}-${parts[2]}T00:00:00`);
            else if (parts.length === 2) start = new Date(`${parts[0]}-${parts[1]}-01T00:00:00`);
            else if (parts.length === 1) start = new Date(`${parts[0]}-01-01T00:00:00`);
        }
        if (endDate) {
            const parts = endDate.split('/');
            if (parts.length === 3) end = new Date(`${parts[0]}-${parts[1]}-${parts[2]}T23:59:59`);
            else if (parts.length === 2) end = new Date(parseInt(parts[0]), parseInt(parts[1]), 0, 23, 59, 59);
            else if (parts.length === 1) end = new Date(parseInt(parts[0]), 11, 31, 23, 59, 59);
        }

        const itemWhere = {};
        if (start && end) itemWhere.createdAt = { [Op.between]: [start, end] };
        else if (start) itemWhere.createdAt = { [Op.gte]: start };
        else if (end) itemWhere.createdAt = { [Op.lte]: end };

        const vendors = await db.Vendor.findAll({
            include: [
                {
                    model: db.VendorItem,
                    as: 'VendorItems',
                    attributes: ['costPerUnit'],
                    where: itemWhere,
                    required: false,
                },
            ],
        });

        const report = vendors.map((vendor) => {
            const totalItems = vendor.VendorItems.length;
            const totalCost = vendor.VendorItems.reduce((sum, item) => sum + parseFloat(item.costPerUnit || 0), 0);

            return {
                vendorId: vendor.id,
                vendorName: vendor.name,
                totalItems,
                totalCost,
            };
        });

        return res.status(status.OK).json({ message: 'Vendor summary report generated', data: report });
    } catch (err) {
        console.error('Vendor Summary Report Error:', err.message);
        return res.status(status.InternalServerError).json({
            message: 'Something went wrong',
            error: err.message,
        });
    }
};

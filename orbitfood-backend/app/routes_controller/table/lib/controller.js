const { status, common } = require('../../../../utils');
const db = require('../../../db/models');
const logActivity = require('../../../../utils/lib/auditLog/activityLogger');

exports.create = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { body, user } = req;
        if (!body.tableNumber) {
            await transaction.rollback();
            return res.status(status.BadRequest).json({ message: 'tableNumber is required' });
        }

        const existing = await db.RestaurantTable.findOne({ where: { tableNumber: body.tableNumber } });
        if (existing) {
            await transaction.rollback();
            return res.status(status.Conflict).json({ message: 'A table with this number already exists' });
        }

        const table = await db.RestaurantTable.create(
            {
                tenantId: user.tenantId,
                tableNumber: body.tableNumber,
                capacity: body.capacity || 2,
                section: body.section || null,
                status: body.status || 'available',
                createdBy: user.id,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            { transaction }
        );

        await transaction.commit();
        await logActivity(req, 'create', table);
        return res.status(status.OK).json({ message: 'Table created successfully!', data: table });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Create Table API', req, res);
    }
};

exports.update = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        const { body, user } = req;

        const table = await db.RestaurantTable.findByPk(id);
        if (!table) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Table not found!' });
        }

        const oldData = JSON.parse(JSON.stringify(table.get({ plain: true })));

        table.set({
            tableNumber: body.tableNumber ?? table.tableNumber,
            capacity: body.capacity ?? table.capacity,
            section: body.section ?? table.section,
            status: body.status ?? table.status,
            updatedBy: user.id,
            updatedAt: new Date(),
        });

        await table.save({ transaction });
        await transaction.commit();
        await logActivity(req, 'update', table, oldData);
        return res.status(status.OK).json({ message: 'Table updated successfully!', data: table });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Update Table API', req, res);
    }
};

exports.delete = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        const table = await db.RestaurantTable.findByPk(id);
        if (!table) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Table not found!' });
        }

        await db.RestaurantTable.destroy({ where: { id }, transaction });
        await transaction.commit();
        await logActivity(req, 'delete', table);
        return res.status(status.OK).json({ message: 'Table deleted successfully.' });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Delete Table API', req, res);
    }
};

exports.findAll = async (req, res) => {
    try {
        const tables = await db.RestaurantTable.findAll({ order: [['tableNumber', 'ASC']] });
        return res.status(status.OK).json({ data: tables });
    } catch (error) {
        return common.throwException(error, 'Find All Tables', req, res);
    }
};

exports.updateStatus = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        const { status: newStatus } = req.body;
        if (!['available', 'occupied', 'reserved', 'cleaning'].includes(newStatus)) {
            await transaction.rollback();
            return res.status(status.BadRequest).json({ message: 'Invalid status value' });
        }

        const table = await db.RestaurantTable.findByPk(id);
        if (!table) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Table not found!' });
        }

        table.status = newStatus;
        table.updatedBy = req.user.id;
        table.updatedAt = new Date();
        await table.save({ transaction });

        await transaction.commit();
        await logActivity(req, 'statusupdate', table);
        return res.status(status.OK).json({ message: 'Table status updated successfully!', data: table });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Update Table Status API', req, res);
    }
};

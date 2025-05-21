const { Op } = require('sequelize');
const { status, common, dbCommon, findWithFilters } = require('../../../../utils');
const db = require('../../../db/models');

exports.create = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { title, key, value, remark, status: statusValue } = req.body;

        const setting = await db.Setting.create(
            {
                title,
                key,
                value,
                remark,
                status: statusValue,
                createdBy: req.user.id,
            },
            { transaction }
        );

        await transaction.commit();
        return res.status(status.OK).json({ message: 'Setting created successfully!', data: setting });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Create Setting API', req, res);
    }
};

exports.update = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { title, key, value, remark, status: statusValue } = req.body;
        const { id } = req.params;

        const setting = await db.Setting.findByPk(id, { transaction });
        if (!setting) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Setting not found!' });
        }

        const duplicate = await db.Setting.findOne({
            where: {
                id: { [Op.ne]: id },
                key,
            },
        });

        if (duplicate) {
            await transaction.rollback();
            return res.status(status.Conflict).json({ message: 'Setting with this key already exists.' });
        }

        setting.set({
            title,
            key,
            value,
            remark,
            status: statusValue,
            updatedBy: req.user.id,
        });

        await setting.save({ transaction });
        await transaction.commit();
        return res.status(status.OK).json({ message: 'Setting updated successfully!', data: setting });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Update Setting API', req, res);
    }
};

exports.delete = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;

        const setting = await db.Setting.findByPk(id, { transaction });
        if (!setting) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Setting not found!' });
        }

        const hasChildren = await dbCommon.hasAnyChildren(setting);
        if (hasChildren.hasChildren) {
            return res.status(status.Conflict).json({ message: hasChildren.message });
        }

        await db.Setting.destroy({ where: { id }, transaction });
        await transaction.commit();
        return res.status(status.OK).json({ message: 'Setting deleted successfully.' });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Delete Setting API', req, res);
    }
};

exports.findById = async (req, res) => {
    try {
        const { id } = req.params;
        const setting = await db.Setting.findByPk(id);
        if (!setting) return res.status(status.NotFound).json({ message: 'Setting not found!' });
        return res.status(status.OK).json({ data: setting });
    } catch (error) {
        return common.throwException(error, 'Find Setting By ID', req, res);
    }
};

exports.findAll = async (req, res) => {
    try {
        const settings = await db.Setting.findAll({ order: [['createdAt', 'DESC']] });
        return res.status(status.OK).json({ data: settings });
    } catch (error) {
        return common.throwException(error, 'Find All Settings', req, res);
    }
};

exports.updateStatus = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        const setting = await db.Setting.findByPk(id);
        if (!setting) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Invalid setting ID!' });
        }

        setting.status = setting.status === '1' ? '0' : '1';
        await setting.save({ transaction });
        await transaction.commit();
        return res.status(status.OK).json({ message: 'Status updated successfully!' });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Update Setting Status API', req, res);
    }
};

exports.settingFiltration = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { body } = req;

        const filters = await findWithFilters.findWithFilters(body, db.Setting);
        const whereCondition = {
            ...filters.filterCondition,
        };

        const page = parseInt(body.page) || 1;
        const limit = parseInt(body.limit) || 10;
        const offset = (page - 1) * limit;

        const settings = await db.Setting.findAndCountAll({
            where: whereCondition,
            limit,
            offset,
            order: [['createdAt', 'DESC']],
            transaction,
        });

        await transaction.commit();
        return res.status(status.OK).json({ data: settings });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Setting Filter API', req, res);
    }
};

exports.settingForFilter = async (req, res) => {
    try {
        const data = [
            { value: 'title', label: 'Title', type: 'text' },
            { value: 'key', label: 'Key', type: 'text' },
            { value: 'status', label: 'Status', type: 'dropdown' },
            { value: 'createdAt', label: 'Created At', type: 'date' },
        ];
        return res.status(status.OK).json({ data });
    } catch (error) {
        return common.throwException(error, 'Setting Filter Config', req, res);
    }
};

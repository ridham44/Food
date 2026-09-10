const { Op } = require('sequelize');
const { status, common, dbCommon, findWithFilters } = require('../../../../utils');
const db = require('../../../db/models');
const logActivity = require('../../../../utils/lib/auditLog/activityLogger');

exports.create = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    const { name, stateCode, countryId, description } = req.body;
    try {
        const country = await db.GeoCountry.findOne({ where: { id: countryId } });
        if (!country) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'No country found!!' });
        }
        const state = await db.GeoState.create(
            {
                name: name,
                stateCode: stateCode,
                countryId: countryId,
                description: description,
            },
            { transaction }
        );

        if (state) {
            await logActivity(req, 'create', state);
            await transaction.commit();
            return res.status(status.OK).json({ message: 'State added successfully!' });
        }
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Create State Api', req, res);
    }
};
exports.update = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { name, stateCode, countryId, description } = req.body;
        const { id } = req.params;

        const state = await db.GeoState.findOne({
            where: { id: id },
            transaction,
        });
        if (!state) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'State not found!' });
        }

        const country = await db.GeoCountry.findOne({ where: { id: countryId }, transaction });

        if (!country) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'No country found!!' });
        }
        const existingName = await db.GeoState.findOne({
            where: {
                id: { [Op.ne]: id },
                name: name,
            },
        });
        if (existingName) {
            return res.status(status.Conflict).json({
                message: 'State already exists',
            });
        }
        const oldData = JSON.parse(JSON.stringify(country.get({ plain: true })));
        const stateData = {
            name: name,
            stateCode: stateCode,
            countryId: countryId,
            description: description,
        };

        state.set(stateData);

        await state.save({ transaction });

        await transaction.commit();
        await logActivity(req, 'update', state, oldData);

        return res.status(status.OK).json({ message: 'State updated successfully!' });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Update State Api', req, res);
    }
};
exports.delete = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    const { id } = req.params;
    try {
        const state = await db.GeoState.findOne({ where: { id: id }, transaction });
        if (!state) {
            await transaction.rollback();
            return res.status(status.BadRequest).json({ message: 'No state found!' });
        }

        let hasChildren = await dbCommon.hasAnyChildren(state);

        if (hasChildren.hasChildren === true) {
            return res.status(status.Conflict).json({
                message: hasChildren.message,
            });
        }
        await db.GeoState.destroy({ where: { id: id } });
        await transaction.commit();
        await logActivity(req, 'delete', state);

        return res.status(status.OK).json({ message: 'State deleted successfully.' });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Delete State Api', req, res);
    }
};
exports.stateFiltration = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { body } = req;
        let whereCondition = {};

        let stateFilter = {};

        if (body) stateFilter = await findWithFilters.findWithFilters(req.body, db.GeoState);

        whereCondition = {
            countryId: body.countryId,
            ...stateFilter.filterCondition,
        };

        const page = parseInt(body.page) || 1;
        const limit = parseInt(body.limit) || 10;

        const offset = (page - 1) * limit;

        const states = await db.GeoState.findAndCountAll({
            where: whereCondition,
            limit: limit,
            offset: offset,
            order: [['createdAt', 'DESC']],
        });
        await transaction.commit();
        return res.status(status.OK).json({ data: states });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'State Filter api', req, res);
    }
};

exports.stateForFilter = async (req, res) => {
    try {
        const data = [
            { value: 'name', label: 'Name', type: 'text' },
            { value: 'stateCode', label: 'State Code', type: 'dropdown' },
            { value: 'description', label: 'Description', type: 'text' },
            { value: 'status', label: 'Status', type: 'dropdown' },
            { value: 'createdAt', label: 'Created At', type: 'date' },
        ];
        return res.status(status.OK).json({ data: data });
    } catch (error) {
        return common.throwException(error, 'Get State For Filter', req, res);
    }
};

exports.findById = async (req, res) => {
    try {
        const { id } = req.params;

        const state = await db.GeoState.findOne({
            where: { id: id },
        });
        if (!state) {
            return res.status(status.NotFound).json({ message: 'State not found!' });
        }
        res.status(status.OK).json({ data: state });
    } catch (error) {
        return common.throwException(error, 'Get One State Api', req, res);
    }
};
exports.updateStatus = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    const { id } = req.params;
    try {
        const stateData = await db.GeoState.findOne({
            where: { id: id },
        });
        if (!stateData) {
            await transaction.rollback();
            return res.status(status.BadRequest).json({ message: 'State not found!!' });
        }
        const oldData = JSON.parse(JSON.stringify(stateData.get({ plain: true })));

        stateData.set({
            status: stateData.status === '1' ? '0' : '1',
        });
        await stateData.save({ transaction });
        await transaction.commit();
        await logActivity(req, 'update', stateData, oldData);
        return res.status(status.OK).json({ message: 'Updated Successfully!' });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Update state status api', req, res);
    }
};

exports.findAll = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        let columns = {};

        let whereCondition = {};

        if (req.params.id) {
            whereCondition.countryId = req.params.id;
        }

        if (req.path.endsWith('options')) {
            whereCondition.status = '1';
            columns.attributes = [
                [db.sequelize.col('GeoState.id'), 'value'],
                [db.sequelize.col('GeoState.name'), 'label'],
                [db.sequelize.col('GeoState.stateCode'), 'State Code'],
            ];
        } else {
            columns.include = [];
        }

        const state = await db.GeoState.findAll({
            where: {
                ...whereCondition,
            },
            order: [['createdAt', 'DESC']],
            ...columns,
            transaction,
        });
        await transaction.commit();
        return res.status(status.OK).json({ data: state });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Get State', req, res);
    }
};
exports.filtration = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { fromDate, toDate, page = 1, limit = 10, countryId, stateCode, status: stateStatus } = req.body;

        if ((fromDate && isNaN(Date.parse(fromDate))) || (toDate && isNaN(Date.parse(toDate)))) {
            return res.status(status.BadRequest).json({
                message: 'Invalid date format. Please use YYYY-MM-DD format for fromDate and toDate.',
            });
        }

        if (stateCode && stateCode.length >= 3) {
            return res.status(status.BadRequest).json({
                message: 'stateCode must be exactly 3 characters long.',
            });
        }

        if (stateStatus !== undefined && stateStatus !== 0 && stateStatus !== 1 && stateStatus !== '0' && stateStatus !== '1') {
            return res.status(status.BadRequest).json({
                message: 'Invalid status. Must be either 0 (Inactive) or 1 (Active).',
            });
        }

        let whereCondition = {};
        let stateFilter = {};

        if (req.body) {
            stateFilter = await findWithFilters.findWithFilters(req.body, db.GeoState);
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

        if (countryId) {
            whereCondition.countryId = countryId;
        }

        if (stateCode) {
            whereCondition.stateCode = stateCode;
        }
        if (stateStatus !== undefined) {
            whereCondition.status = stateStatus.toString();
        }

        whereCondition = {
            ...whereCondition,
            ...stateFilter.filterCondition,
        };

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const states = await db.GeoState.findAndCountAll({
            where: whereCondition,
            limit: parseInt(limit),
            offset: offset,
            order: [['createdAt', 'DESC']],
            transaction,
        });

        await transaction.commit();
        return res.status(status.OK).json({ data: states });
    } catch (error) {
        if (transaction && !transaction.finished) {
            await transaction.rollback();
        }
        return common.throwException(error, 'State Date Filter API', req, res);
    }
};

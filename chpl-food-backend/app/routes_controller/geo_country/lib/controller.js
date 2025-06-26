const { Op } = require('sequelize');
const { status, common, dbCommon, findWithFilters } = require('../../../../utils');
const db = require('../../../db/models');
const logActivity = require('../../../../utils/lib/auditLog/activityLogger');

exports.create = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { body, file } = req;

        const country = await db.GeoCountry.create(
            {
                name: body.name,
                countryCode: body.countryCode,
                currencyCode: body.currencyCode,
                telephonePrefix: body.telephonePrefix,
                flag: file ? `/${file.path.replace(/\\/g, '/')}` : null,
                description: body.description,
            },
            { transaction }
        );
        await logActivity(req, 'create', country);
        await transaction.commit();
        if (country) {
            return res.status(status.OK).json({ message: 'Country added successfully!' });
        }
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Create update api', req, res);
    }
};
exports.update = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { body, file } = req;
        const existingData = await db.GeoCountry.findOne({
            where: {
                id: { [Op.ne]: req.params.id },
                name: body.name,
            },
        });
        if (existingData) {
            return res.status(status.Conflict).json({
                message: 'Country Already exists!',
            });
        }
        const countryData = {
            name: body.name,
            countryCode: body.countryCode,
            currencyCode: body.currencyCode,
            telephonePrefix: body.telephonePrefix,
            flag: file ? `/${file.path.replace(/\\/g, '/')}` : null,
            description: body.description,
        };
        const country = await db.GeoCountry.findOne({ where: { id: req.params.id }, transaction });
        if (!country) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Data not found' });
        }
        const oldData = JSON.parse(JSON.stringify(country.get({ plain: true })));

        country.set(countryData);

        await country.save({ transaction });

        await transaction.commit();
        await logActivity(req, 'update', country, oldData);

        return res.status(status.OK).json({ message: 'Country updated successfully.' });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Update country api', req, res);
    }
};

// delete country
exports.delete = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const country = await db.GeoCountry.findOne({
            where: {
                id: req.params.id,
            },
            transaction,
        });

        if (!country) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Data not found' });
        }

        let hasChildren = await dbCommon.hasAnyChildren(country);

        if (hasChildren.hasChildren == true) {
            return res.status(status.Conflict).json({
                message: hasChildren.message,
            });
        }
        await db.GeoCountry.destroy({ where: { id: req.params.id } });
        await transaction.commit();
        await logActivity(req, 'delete', country);
        return res.status(status.OK).json({ message: 'Country deleted successfully.' });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Delete Country', req, res);
    }
};

exports.countryFiltration = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { body } = req;
        let whereCondition = {};
        let countryFilter = {};

        if (body) countryFilter = await findWithFilters.findWithFilters(body, db.GeoCountry);
        whereCondition = {
            ...countryFilter.filterCondition,
        };

        const page = parseInt(body.page) || 1;
        const limit = parseInt(body.limit) || 10;

        const offset = (page - 1) * limit;

        let country = await db.GeoCountry.findAndCountAll({
            where: whereCondition,
            limit: limit,
            offset: offset,
            order: [['createdAt', 'DESC']],
            transaction,
        });
        await transaction.commit();
        return res.status(status.OK).json({ data: country });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'All Country api', req, res);
    }
};

exports.countryForFilter = async (req, res) => {
    try {
        const data = [
            { value: 'name', label: 'Name', type: 'text' },
            { value: 'countryCode', label: 'Country Code', type: 'dropdown' },
            { value: 'currencyCode', label: 'Currency Code', type: 'dropdown' },
            { value: 'telephonePrefix', label: 'Telephone Prefix', type: 'dropdown' },
            { value: 'description', label: 'Description', type: 'text' },
            { value: 'status', label: 'Status', type: 'dropdown' },
            { value: 'createdAt', label: 'Created At', type: 'date' },
        ];
        return res.status(status.OK).json({ data: data });
    } catch (error) {
        return common.throwException(error, 'Get Country for Filter', req, res);
    }
};

exports.findById = async (req, res) => {
    try {
        const country = await db.GeoCountry.findOne({
            where: {
                id: req.params.id,
            },
        });

        if (!country) {
            return res.status(status.NotFound).json({ message: 'Data not found' });
        }
        res.status(status.OK).json({ data: country });
    } catch (error) {
        return common.throwException(error, 'Get One Country Api', req, res);
    }
};

exports.updateStatus = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const country = await db.GeoCountry.findOne({
            where: {
                id: req.params.id,
            },
            transaction,
        });

        if (!country) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Data not found' });
        }
        const oldData = JSON.parse(JSON.stringify(country.get({ plain: true })));
        country.set({
            status: country.status === '1' ? '0' : '1',
            updatedBy: req.user.id,
        });

        await country.save({ transaction });

        await transaction.commit();
        await logActivity(req, 'update', country, oldData);

        res.status(status.OK).json({ message: 'Status updated successfully' });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Update Country Status', req, res);
    }
};

// find all
exports.findAll = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        let columns = {};

        let whereCondition = {};

        if (req.path.endsWith('options')) {
            whereCondition.status = '1';
            columns.attributes = [
                [db.sequelize.col('GeoCountry.id'), 'value'],
                [db.sequelize.col('GeoCountry.name'), 'label'],
                [db.sequelize.col('GeoCountry.telephonePrefix'), 'telephonePrefix'],
            ];
        } else {
            columns.include = [];
        }

        const country = await db.GeoCountry.findAll({
            where: {
                ...whereCondition,
            },
            order: [['createdAt', 'DESC']],
            ...columns,
            transaction,
        });
        await transaction.commit();
        return res.status(status.OK).json({ data: country });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Get Country', req, res);
    }
};

exports.filtration = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { fromDate, toDate, page = 1, limit = 10, telephonePrefix, currencyCode, status: countryStatus } = req.body;

        if ((fromDate && isNaN(Date.parse(fromDate))) || (toDate && isNaN(Date.parse(toDate)))) {
            return res.status(status.BadRequest).json({
                message: 'Invalid date format. Please use YYYY-MM-DD format for fromDate and toDate.',
            });
        }

        if (telephonePrefix && telephonePrefix.length !== 3) {
            return res.status(status.BadRequest).json({
                message: 'telephonePrefix must be exactly 3 characters long.',
            });
        }

        if (currencyCode && currencyCode.length !== 3) {
            return res.status(status.BadRequest).json({
                message: 'currencyCode must be exactly 3 characters long.',
            });
        }

        if (countryStatus !== undefined && countryStatus !== 0 && countryStatus !== 1 && countryStatus !== '0' && countryStatus !== '1') {
            return res.status(status.BadRequest).json({
                message: 'Invalid status. Must be either 0 (Inactive) or 1 (Active).',
            });
        }

        let whereCondition = {};
        let countryFilter = {};

        if (req.body) {
            countryFilter = await findWithFilters.findWithFilters(req.body, db.GeoCountry);
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

        if (telephonePrefix) {
            whereCondition.telephonePrefix = telephonePrefix;
        }

        if (currencyCode) {
            whereCondition.currencyCode = currencyCode;
        }

        if (countryStatus !== undefined) {
            whereCondition.status = countryStatus.toString();
        }

        whereCondition = {
            ...whereCondition,
            ...countryFilter.filterCondition,
        };

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const countries = await db.GeoCountry.findAndCountAll({
            where: whereCondition,
            limit: parseInt(limit),
            offset: offset,
            order: [['createdAt', 'DESC']],
            transaction,
        });

        await transaction.commit();
        return res.status(status.OK).json({ data: countries });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Country Date Filter API', req, res);
    }
};

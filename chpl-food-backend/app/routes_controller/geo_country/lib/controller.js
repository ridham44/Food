const { Op } = require('sequelize');
const { status, common, dbCommon, findWithFilters } = require('../../../../utils');
const db = require('../../../db/models');

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

        country.set(countryData);

        await country.save({ transaction });

        await transaction.commit();

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

        country.set({
            status: country.status === '1' ? '0' : '1',
            updatedBy: req.user.id,
        });

        await country.save({ transaction });

        await transaction.commit();

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

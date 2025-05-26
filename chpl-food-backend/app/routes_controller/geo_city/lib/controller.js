const { Op } = require('sequelize');
const { status, common, dbCommon, findWithFilters } = require('../../../../utils');
const db = require('../../../db/models');
exports.create = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const { name, cityCode, countryId, stateId, description } = req.body;

        const country = await db.GeoCountry.findOne({ where: { id: countryId } });
        if (!country) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'No country found!!' });
        }
        const state = await db.GeoState.findOne({ where: { id: stateId } });
        if (!state) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'No state found!!' });
        }
        const city = await db.GeoCity.create(
            {
                name: name,
                cityCode: cityCode,
                countryId: countryId,
                stateId: stateId,
                description: description,
            },
            { transaction }
        );
        if (city) {
            await transaction.commit();
            return res.status(status.OK).json({ message: 'City added successfully!' });
        }
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Create City Api', req, res);
    }
};
exports.update = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    const { name, cityCode, countryId, stateId, description } = req.body;
    const { id } = req.params;
    try {
        const city = await db.GeoCity.findOne({ where: { id: id }, transaction });
        if (!city) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'City not found!' });
        }

        const country = await db.GeoCountry.findOne({ where: { id: countryId }, transaction });
        if (!country) {
            await transaction.rollback();
            return res.status(status.InternalServerError).json({ message: 'No country found!!' });
        }
        const state = await db.GeoState.findOne({ where: { id: stateId }, transaction });
        if (!state) {
            await transaction.rollback();
            return res.status(status.InternalServerError).json({ message: 'No state found!!' });
        }
        const existingData = await db.GeoCity.findOne({
            where:{
               id:{[Op.ne]:req.params.id},name:name
            }
        })
        if(existingData){
            return res.status(status.Conflict).json({
                message:'City already exists'
            })
        }
        const cityData = {
            name: name,
            cityCode: cityCode,
            countryId: countryId,
            stateId: stateId,
            description: description,
        };
        city.set(cityData);
        await city.save({ transaction });

        await transaction.commit();

        return res.status(status.OK).json({ message: 'City updated successfully!' });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Update City Api', req, res);
    }
};
exports.delete = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const { id } = req.params;

        const city = await db.GeoCity.findOne({ where: { id: id }, transaction });
        if (!city) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'City not found!' });
        }

        let hasChildren = await dbCommon.hasAnyChildren(city);

        if (hasChildren.hasChildren == true) {
            return res.status(status.Conflict).json({
                message: hasChildren.message,
            });
        }

        await db.GeoCity.destroy({ where: { id: req.params.id } });
        await transaction.commit();

        return res.status(status.OK).json({ message: 'City deleted successfully.' });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Delete City Api', req, res);
    }
};
exports.cityFiltration = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { body } = req;
        let whereCondition = {};
        let cityFilter = {};

        if (body) cityFilter = await findWithFilters.findWithFilters(req.body, db.GeoCity);

        whereCondition = {
            stateId: body.stateId,
            ...cityFilter.filterCondition,
        };

        const page = parseInt(body.page) || 1;
        const limit = parseInt(body.limit) || 10;
        const offset = (page - 1) * limit;

        const cities = await db.GeoCity.findAndCountAll({
            where: { ...whereCondition },
            limit: limit,
            offset: offset,
            order: [['createdAt', 'DESC']],
            transaction,
        });

        await transaction.commit();
        return res.status(status.OK).json({ data: cities });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'City Filter Api', req, res);
    }
};

exports.cityForFilter = async (req, res) => {
    try {
        const data = [
            { value: 'name', label: 'Name', type: 'text' },
            { value: 'cityCode', label: 'City Code', type: 'dropdown' },
            { value: 'description', label: 'Description', type: 'text' },
            { value: 'status', label: 'Status', type: 'dropdown' },
            { value: 'createdAt', label: 'Created At', type: 'date' },
        ];
        return res.status(status.OK).json({ data: data });
    } catch (error) {
        return common.throwException(error, 'Get State for Filter', req, res);
    }
};

exports.findById = async (req, res) => {
    const { id } = req.params;
    try {
        const city = await db.GeoCity.findOne({
            where: { id: id },
        });
        if (!city) {
            return res.status(status.NotFound).json({ message: 'City not found!' });
        }
        res.status(status.OK).json({ data: city });
    } catch (error) {
        return common.throwException(error, 'Find One State Api', req, res);
    }
};
exports.updateStatus = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    const { id } = req.params;
    try {
        const cityData = await db.GeoCity.findOne({
            where: { id: id },
        });
        if (!cityData) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Enter valid id!!' });
        }

        cityData.set({
            status: cityData.status === '1' ? '0' : '1',
        });

        await cityData.save();
        return res.status(status.OK).json({ message: 'Status updated Successfully!' });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Update City Status Api', req, res);
    }
};

exports.findAll = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        let columns = {};

        let whereCondition = {};

        if (req.params.id) {
            whereCondition.stateId = req.params.id;
        }

        if (req.path.endsWith('options')) {
            whereCondition.status = '1';
            columns.attributes = [
                [db.sequelize.col('GeoCity.id'), 'value'],
                [db.sequelize.col('GeoCity.name'), 'label'],
                [db.sequelize.col('GeoCity.cityCode'), 'City Code'],
            ];
        } else {
            columns.include = [];
        }

        const city = await db.GeoCity.findAll({
            where: {
                ...whereCondition,
            },
            order: [['createdAt', 'DESC']],
            ...columns,
            transaction,
        });
        await transaction.commit();
        return res.status(status.OK).json({ data: city });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Get City', req, res);
    }
};
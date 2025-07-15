const { status, common, findWithFilters } = require('../../../../utils');
const db = require('../../../db/models');
const { Op } = require('sequelize');
const fs = require('fs');
const logActivity = require('../../../../utils/lib/auditLog/activityLogger');

exports.create = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { body, file, user } = req;
        const tenant = await db.Tenant.findByPk(user.tenantId);
        if (!tenant) {
            if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
            return res.status(status.BAD_REQUEST).json({ message: 'Invalid tenant' });
        }

        const menu = await db.Menu.create(
            {
                parentId: body.parentId,
                name: body.name,
                price: body.price,
                description: body.description,
                filePath: file ? `/${file.path.replace(/\\/g, '/')}` : null,
                tenantId: user.tenantId,
                createdBy: user.id,
            },
            { transaction }
        );
        await logActivity(req, 'create', menu);
        await transaction.commit();
        return res.status(status.OK).json({ message: 'Menu created successfully!', data: menu });
    } catch (error) {
        if (req.file?.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        await transaction.rollback();
        return common.throwException(error, 'Create Menu API', req, res);
    }
};

exports.update = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        const { body, file, user } = req;
        const tenant = await db.Tenant.findByPk(user.tenantId);
        if (!tenant) {
            if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
            return res.status(status.BAD_REQUEST).json({ message: 'Invalid tenant' });
        }

        const menu = await db.Menu.findByPk(id);
        if (!menu) {
            await transaction.rollback();
            if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
            return res.status(status.NotFound).json({ message: 'Menu not found!' });
        }
        const existingName = await db.Menu.findOne({
            where: {
                id: { [Op.ne]: id },
                name: body.name,
            },
        });
        if (existingName) {
            if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
            return res.status(status.Conflict).json({ message: 'Menu already exists' });
        }
        const oldData = JSON.parse(JSON.stringify(menu.get({ plain: true })));
        menu.set({
            parentId: body.parentId,
            name: body.name,
            price: body.price,
            description: body.description,
            filePath: file ? `/${file.path.replace(/\\/g, '/')}` : null,
            tenantId: user.tenantId,
            updatedBy: user.id,
        });

        await menu.save({ transaction });
        await transaction.commit();
        await logActivity(req, 'update', menu, oldData);
        return res.status(status.OK).json({ message: 'Menu updated successfully!', data: menu });
    } catch (error) {
        if (req.file?.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        await transaction.rollback();
        return common.throwException(error, 'Update Menu API', req, res);
    }
};

exports.delete = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        const menu = await db.Menu.findByPk(id);
        if (!menu) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Menu not found!' });
        }

        const hasChildren = await db.Menu.findOne({ where: { parentId: id } });
        if (hasChildren) {
            return res.status(status.Conflict).json({ message: 'Menu has child entries and cannot be deleted.' });
        }
        if (menu.filePath && fs.existsSync(`.${menu.filePath}`)) {
            fs.unlinkSync(`.${menu.filePath}`);
        }
        await db.Menu.destroy({ where: { id } });
        await transaction.commit();
        await logActivity(req, 'delete', menu);
        return res.status(status.OK).json({ message: 'Menu deleted successfully.' });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Delete Menu API', req, res);
    }
};

exports.findById = async (req, res) => {
    try {
        const { id } = req.params;
        const menu = await db.Menu.findByPk(id);
        if (!menu) {
            return res.status(status.NotFound).json({ message: 'Menu not found!' });
        }
        return res.status(status.OK).json({ data: menu });
    } catch (error) {
        return common.throwException(error, 'Find Menu By ID', req, res);
    }
};

exports.findAll = async (req, res) => {
    try {
        const menus = await db.Menu.findAll({ order: [['createdAt', 'DESC']] });
        return res.status(status.OK).json({ data: menus });
    } catch (error) {
        return common.throwException(error, 'Find All Menus', req, res);
    }
};

exports.menuFiltration = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { body } = req;
        const filters = await findWithFilters.findWithFilters(body, db.Menu);

        const whereCondition = {
            tenantId: body.tenantId,
            ...filters.filterCondition,
        };

        const page = parseInt(body.page) || 1;
        const limit = parseInt(body.limit) || 10;
        const offset = (page - 1) * limit;

        const menus = await db.Menu.findAndCountAll({
            where: whereCondition,
            limit,
            offset,
            order: [['createdAt', 'DESC']],
            transaction,
        });

        await transaction.commit();
        return res.status(status.OK).json({ data: menus });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Menu Filter API', req, res);
    }
};

exports.menuForFilter = async (req, res) => {
    try {
        const data = [
            { value: 'name', label: 'Menu Name', type: 'text' },
            { value: 'price', label: 'Price', type: 'number' },
            { value: 'createdAt', label: 'Created At', type: 'date' },
        ];
        return res.status(status.OK).json({ data });
    } catch (error) {
        return common.throwException(error, 'Menu Filter Config', req, res);
    }
};

exports.filtration = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { fromDate, toDate, page = 1, limit = 10, minPrice, maxPrice } = req.body;

        if ((fromDate && isNaN(Date.parse(fromDate))) || (toDate && isNaN(Date.parse(toDate)))) {
            return res.status(status.BadRequest).json({
                message: 'Invalid date format. Please use YYYY-MM-DD format for fromDate and toDate.',
            });
        }

        if ((minPrice && isNaN(minPrice)) || (maxPrice && isNaN(maxPrice))) {
            return res.status(status.BadRequest).json({
                message: 'minPrice and maxPrice must be valid numbers.',
            });
        }

        let whereCondition = {};
        let menuFilter = {};

        if (req.body) {
            menuFilter = await findWithFilters.findWithFilters(req.body, db.Menu);
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

        if (minPrice && maxPrice) {
            whereCondition.price = {
                [Op.between]: [parseFloat(minPrice), parseFloat(maxPrice)],
            };
        } else if (minPrice) {
            whereCondition.price = {
                [Op.gte]: parseFloat(minPrice),
            };
        } else if (maxPrice) {
            whereCondition.price = {
                [Op.lte]: parseFloat(maxPrice),
            };
        }

        whereCondition = {
            ...whereCondition,
            ...menuFilter.filterCondition,
        };

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const menus = await db.Menu.findAndCountAll({
            where: whereCondition,
            limit: parseInt(limit),
            offset: offset,
            order: [['createdAt', 'DESC']],
            transaction,
        });

        await transaction.commit();
        return res.status(status.OK).json({ data: menus });
    } catch (error) {
        if (transaction && !transaction.finished) {
            await transaction.rollback();
        }
        return common.throwException(error, 'Menu Date Filter API', req, res);
    }
};

exports.findByIdForCustomer = async (req, res) => {
    try {
        const tenantId = req.params.tenantId;

        if (!tenantId) {
            return res.status(status.BadRequest).json({ message: 'Tenant ID is required in params.' });
        }

        const menus = await db.Menu.findAll({
            where: { tenantId },
            disableTenantCheck: true, 
            attributes: ['id', 'parentId', 'name', 'price', 'filePath', 'description'],
            include: [
                {
                    model: db.Tenant,
                    as: 'Tenant',
                    attributes: ['companyName', 'mobile', 'email', 'contactPerson', 'address'],
                },
            ],
            order: [['createdAt', 'DESC']],
        });

        if (!menus || !menus.length) {
            return res.status(status.BadRequest).json({ message: 'No menus found for this tenant!' });
        }

        return res.status(status.OK).json({ data: menus });
    } catch (error) {
        return common.throwException(error, 'Find Menus By Tenant ID', req, res);
    }
};

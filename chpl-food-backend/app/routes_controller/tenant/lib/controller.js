const { status, common, dbCommon, findWithFilters } = require('../../../../utils');
const db = require('../../../db/models');

exports.create = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { body, files, user } = req;

        const tenant = await db.Tenant.create(
            {
                shortCode: body.shortCode,
                companyName: body.companyName,
                contactPerson: body.contactPerson,
                countryCode: body.countryCode,
                mobile: body.mobile,
                phoneCountryCode: body.phoneCountryCode,
                phone: body.phone,
                email: body.email,
                address: body.address,
                countryId: body.countryId,
                stateId: body.stateId,
                cityId: body.cityId,
                zipCode: body.zipCode,
                gstNumber: body.gstNumber,
                panNumber: body.panNumber,
                frontImage: files?.frontImage?.[0] ? `/${files.frontImage[0].path.replace(/\\/g, '/')}` : null,
                backImage: files?.backImage?.[0] ? `/${files.backImage[0].path.replace(/\\/g, '/')}` : null,
                website: body.website,
                termAndCondition: body.termAndCondition,
                returnAndExchange: body.returnAndExchange,
                status: body.status,
                emailVerified: body.emailVerified,
                emailVerifiedAt: body.emailVerifiedAt,
                approvedAt: body.approvedAt,
                rejectedAt: body.rejectedAt,
                approvedBy: body.approvedBy,
                rejectedBy: body.rejectedBy,
                rejectedReason: body.rejectedReason,
                updatedBy: user.id,
            },
            { transaction }
        );

        await transaction.commit();
        return res.status(status.OK).json({ message: 'Tenant created successfully!', data: tenant });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Create Tenant API', req, res);
    }
};

exports.update = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        const { body, files, user } = req;

        const tenant = await db.Tenant.findByPk(id);
        if (!tenant) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Tenant not found' });
        }

        tenant.set({
            shortCode: body.shortCode,
            companyName: body.companyName,
            contactPerson: body.contactPerson,
            countryCode: body.countryCode,
            mobile: body.mobile,
            phoneCountryCode: body.phoneCountryCode,
            phone: body.phone,
            email: body.email,
            address: body.address,
            countryId: body.countryId,
            stateId: body.stateId,
            cityId: body.cityId,
            zipCode: body.zipCode,
            gstNumber: body.gstNumber,
            panNumber: body.panNumber,
            frontImage: files?.frontImage?.[0] ? `/${files.frontImage[0].path.replace(/\\/g, '/')}` : tenant.frontImage,
            backImage: files?.backImage?.[0] ? `/${files.backImage[0].path.replace(/\\/g, '/')}` : tenant.backImage,
            website: body.website,
            termAndCondition: body.termAndCondition,
            returnAndExchange: body.returnAndExchange,
            status: body.status,
            emailVerified: body.emailVerified,
            emailVerifiedAt: body.emailVerifiedAt,
            approvedAt: body.approvedAt,
            rejectedAt: body.rejectedAt,
            approvedBy: body.approvedBy,
            rejectedBy: body.rejectedBy,
            rejectedReason: body.rejectedReason,
            updatedBy: user.id,
        });

        await tenant.save({ transaction });
        await transaction.commit();

        return res.status(status.OK).json({ message: 'Tenant updated successfully!', data: tenant });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Update Tenant API', req, res);
    }
};

exports.delete = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        const tenant = await db.Tenant.findByPk(id);
        if (!tenant) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Tenant not found' });
        }

        const hasChildren = await dbCommon.hasAnyChildren(tenant);
        if (hasChildren.hasChildren) {
            return res.status(status.Conflict).json({ message: hasChildren.message });
        }

        await db.Tenant.destroy({ where: { id }, transaction });
        await transaction.commit();

        return res.status(status.OK).json({ message: 'Tenant deleted successfully' });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Delete Tenant', req, res);
    }
};

exports.findById = async (req, res) => {
    try {
        const { id } = req.params;
        const tenant = await db.Tenant.findByPk(id);
        if (!tenant) return res.status(status.NotFound).json({ message: 'Tenant not found' });

        return res.status(status.OK).json({ data: tenant });
    } catch (error) {
        return common.throwException(error, 'Find Tenant By ID', req, res);
    }
};

exports.findAll = async (req, res) => {
    try {
        const tenants = await db.Tenant.findAll({ order: [['createdAt', 'DESC']] });
        return res.status(status.OK).json({ data: tenants });
    } catch (error) {
        return common.throwException(error, 'Find All Tenants', req, res);
    }
};

exports.tenantFiltration = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { body } = req;
        const filters = await findWithFilters.findWithFilters(body, db.Tenant);
        const whereCondition = { ...filters.filterCondition };
        const page = parseInt(body.page) || 1;
        const limit = parseInt(body.limit) || 10;
        const offset = (page - 1) * limit;

        const tenants = await db.Tenant.findAndCountAll({
            where: whereCondition,
            limit,
            offset,
            order: [['createdAt', 'DESC']],
            transaction,
        });

        await transaction.commit();
        return res.status(status.OK).json({ data: tenants });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Tenant Filter', req, res);
    }
};

exports.tenantForFilter = async (req, res) => {
    try {
        const data = [
            { value: 'shortCode', label: 'Short Code', type: 'text' },
            { value: 'companyName', label: 'Company Name', type: 'text' },
            { value: 'status', label: 'Status', type: 'dropdown' },
            { value: 'createdAt', label: 'Created At', type: 'date' },
        ];
        return res.status(status.OK).json({ data });
    } catch (error) {
        return common.throwException(error, 'Tenant Filter Config', req, res);
    }
};

exports.updateStatus = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        const { status: newStatus } = req.body;

        const tenant = await db.Tenant.findByPk(id);
        if (!tenant) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Tenant not found' });
        }

        tenant.status = newStatus;
        tenant.updatedBy = req.user.id;
        await tenant.save({ transaction });

        await transaction.commit();
        return res.status(status.OK).json({ message: 'Status updated successfully', data: tenant });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Update Status', req, res);
    }
};

exports.findByCreatedUserId = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(status.Unauthorized).json({ message: 'Unauthorized' });
        }

        const { userId } = req.params;

        if (!userId) {
            return res.status(status.BadRequest).json({ message: 'User ID is required.' });
        }

        const tenants = await db.Tenant.findAll({
            where: { createdBy: userId },
            order: [['createdAt', 'DESC']],
        });

        return res.status(status.OK).json({ data: tenants });
    } catch (error) {
        return common.throwException(error, 'Find Tenant By Created User ID', req, res);
    }
};

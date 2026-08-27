const { status, common, dbCommon, findWithFilters } = require('../../../../utils');
const db = require('../../../db/models');
const { Op } = require('sequelize');
const fs = require('fs');
const logActivity = require('../../../../utils/lib/auditLog/activityLogger');
const { v4: uuidv4 } = require('uuid');

exports.create = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { body, files } = req;

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
                status: '0',
                emailVerified: body.emailVerified,
                emailVerifiedAt: body.emailVerifiedAt,
            },
            { transaction }
        );

        const tenantId = tenant.id;

        const roleTenant = await db.Role.create(
            {
                id: uuidv4(),
                tenantId,
                name: 'Tenant' + tenant.companyName,
                type: '2',
                isAdmin: '0',
                remark: 'Main Tenant',
                status: '1',
            },
            { transaction }
        );

        const defaultPassword = 'tenant@123';
        const contactPerson = body.contactPerson?.trim() || '';
        const [firstName, ...rest] = contactPerson.split(' ');
        const lastName = rest.length ? rest.join(' ') : null;

        await db.User.create(
            {
                id: uuidv4(),
                tenantId,
                roleId: roleTenant.id,
                shortCode: body.shortCode || 'TENANT',
                firstName: firstName || 'John',
                lastName: lastName || null,
                gender: 'male',
                countryCode: body.countryCode,
                mobile: body.mobile,
                email: body.email,
                password: defaultPassword,
                passwordShow: defaultPassword,
                profileImage: null,
                address: body.address,
                countryId: body.countryId,
                stateId: body.stateId,
                cityId: body.cityId,
                zipCode: body.zipCode,
                birthDate: new Date('1990-01-01T00:00:00'),
                anniversaryDate: null,
                notificationPlayerId: null,
                deviceTokenId: null,
                status: '1',
            },
            { transaction }
        );

        await transaction.commit();
        await logActivity(req, 'create', tenant);
        return res.status(status.OK).json({ message: 'Tenant, roles, and default user created successfully!', data: tenant });
    } catch (error) {
        if (req.files?.frontImage?.[0]?.path && fs.existsSync(req.files.frontImage[0].path)) {
            fs.unlinkSync(req.files.frontImage[0].path);
        }
        if (req.files?.backImage?.[0]?.path && fs.existsSync(req.files.backImage[0].path)) {
            fs.unlinkSync(req.files.backImage[0].path);
        }
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
            if (req.files?.frontImage?.[0]?.path && fs.existsSync(req.files.frontImage[0].path)) {
                fs.unlinkSync(req.files.frontImage[0].path);
            }
            if (req.files?.backImage?.[0]?.path && fs.existsSync(req.files.backImage[0].path)) {
                fs.unlinkSync(req.files.backImage[0].path);
            }
            return res.status(status.NotFound).json({ message: 'Tenant not found' });
        }
        const oldData = JSON.parse(JSON.stringify(tenant.get({ plain: true })));

        // Partial updates: only overwrite a field when the caller actually sent
        // it, falling back to the existing value otherwise. This endpoint is
        // used both for full profile edits and single-field toggles (e.g. the
        // dashboard header's open/closed switch), and the latter would
        // otherwise null out every other NOT NULL column.
        const pick = (key) => (body[key] !== undefined ? body[key] : tenant[key]);

        tenant.set({
            shortCode: pick('shortCode'),
            companyName: pick('companyName'),
            contactPerson: pick('contactPerson'),
            countryCode: pick('countryCode'),
            mobile: pick('mobile'),
            phoneCountryCode: pick('phoneCountryCode'),
            phone: pick('phone'),
            email: pick('email'),
            address: pick('address'),
            countryId: pick('countryId'),
            stateId: pick('stateId'),
            cityId: pick('cityId'),
            zipCode: pick('zipCode'),
            gstNumber: pick('gstNumber'),
            panNumber: pick('panNumber'),
            frontImage: files?.frontImage?.[0] ? `/${files.frontImage[0].path.replace(/\\/g, '/')}` : tenant.frontImage,
            backImage: files?.backImage?.[0] ? `/${files.backImage[0].path.replace(/\\/g, '/')}` : tenant.backImage,
            website: pick('website'),
            termAndCondition: pick('termAndCondition'),
            returnAndExchange: pick('returnAndExchange'),
            status: pick('status'),
            emailVerified: pick('emailVerified'),
            emailVerifiedAt: pick('emailVerifiedAt'),
            isOpen: pick('isOpen'),
            openingTime: pick('openingTime'),
            closingTime: pick('closingTime'),
            acceptOrders: pick('acceptOrders'),
            autoAcceptOrders: pick('autoAcceptOrders'),
            preparationTimeMinutes: pick('preparationTimeMinutes'),
            updatedBy: user.id,
        });

        await tenant.save({ transaction });
        await transaction.commit();
        await logActivity(req, 'update', tenant, oldData);
        return res.status(status.OK).json({ message: 'Tenant updated successfully!', data: tenant });
    } catch (error) {
        if (req.files?.frontImage?.[0]?.path && fs.existsSync(req.files.frontImage[0].path)) {
            fs.unlinkSync(req.files.frontImage[0].path);
        }
        if (req.files?.backImage?.[0]?.path && fs.existsSync(req.files.backImage[0].path)) {
            fs.unlinkSync(req.files.backImage[0].path);
        }
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
        if (tenant.frontImage && fs.existsSync(`.${tenant.frontImage}`)) {
            fs.unlinkSync(`.${tenant.frontImage}`);
        }
        if (tenant.backImage && fs.existsSync(`.${tenant.backImage}`)) {
            fs.unlinkSync(`.${tenant.backImage}`);
        }
        await db.Tenant.destroy({ where: { id: id } });
        await transaction.commit();
        await logActivity(req, 'delete', tenant);

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

exports.getCurrent = async (req, res) => {
    try {
        if (!req.user.tenantId) {
            return res.status(status.Forbidden).json({ message: 'Tenant access only' });
        }
        const tenant = await db.Tenant.findByPk(req.user.tenantId);
        if (!tenant) return res.status(status.NotFound).json({ message: 'Tenant not found' });

        return res.status(status.OK).json({ data: tenant });
    } catch (error) {
        return common.throwException(error, 'Get Current Tenant API', req, res);
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
        const newStatus = String(req.body.status);
        const { rejectedReason } = req.body;

        const role = await db.Role.findByPk(req.user.roleId);
        if (!role || !role.name.toLowerCase().includes('admin')) {
            await transaction.rollback();
            return res.status(status.Forbidden).json({ message: `Only admin can update status.` });
        }

        const tenant = await db.Tenant.findByPk(id);
        if (!tenant) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Tenant not found' });
        }
        const oldData = JSON.parse(JSON.stringify(tenant.get({ plain: true })));

        if (newStatus === '1') {
            tenant.approvedAt = new Date();
            tenant.approvedBy = req.user.id;
            tenant.rejectedAt = null;
            tenant.rejectedBy = null;
            tenant.rejectedReason = null;
        } else if (newStatus === '3') {
            if (!rejectedReason) {
                await transaction.rollback();
                return res.status(status.BadRequest).json({ message: 'rejectedReason is required for status = Rejected' });
            }
            tenant.rejectedAt = new Date();
            tenant.rejectedBy = req.user.id;
            tenant.rejectedReason = rejectedReason;
            tenant.approvedAt = null;
            tenant.approvedBy = null;
        } else if (newStatus === '0' || newStatus === '2') {
            tenant.approvedAt = null;
            tenant.approvedBy = null;
            tenant.rejectedAt = null;
            tenant.rejectedBy = null;
            tenant.rejectedReason = null;
        } else {
            await transaction.rollback();
            return res.status(status.BadRequest).json({ message: 'Invalid status value' });
        }

        tenant.status = newStatus;
        tenant.updatedAt = new Date();
        tenant.updatedBy = req.user.id;

        await tenant.save({ transaction });
        await transaction.commit();
        await logActivity(req, 'update', tenant, oldData);

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

exports.filtration = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { body } = req;
        const {
            createdFrom,
            createdTo,
            approvedFrom,
            approvedTo,
            countryCode,
            mobile,
            phone,
            email,
            status: tenantStatus,
            page = 1,
            limit = 10,
        } = body;

        const isInvalidDate = (date) => date && isNaN(Date.parse(date));
        if (isInvalidDate(createdFrom) || isInvalidDate(createdTo) || isInvalidDate(approvedFrom) || isInvalidDate(approvedTo)) {
            return res.status(status.BadRequest).json({
                message: 'Invalid date format. Use YYYY-MM-DD for created/approved dates.',
            });
        }

        if (countryCode && (typeof countryCode !== 'string' || countryCode.length > 3)) {
            return res.status(status.BadRequest).json({
                message: 'Invalid countryCode. Must be a 2–3 character string.',
            });
        }

        if (mobile && (typeof mobile !== 'string' || mobile.length < 8 || mobile.length > 15)) {
            return res.status(status.BadRequest).json({
                message: 'Invalid mobile number. Must be between 8 and 15 digits.',
            });
        }

        if (phone && (typeof phone !== 'string' || phone.length < 6 || phone.length > 15)) {
            return res.status(status.BadRequest).json({
                message: 'Invalid phone number. Must be between 6 and 15 digits.',
            });
        }

        if (email && !/^\S+@\S+\.\S+$/.test(email)) {
            return res.status(status.BadRequest).json({
                message: 'Invalid email format.',
            });
        }

        if (tenantStatus !== undefined && !['0', '1', '2', '3', 0, 1, 2, 3].includes(tenantStatus)) {
            return res.status(status.BadRequest).json({
                message: 'Invalid status. Must be 0, 1, 2, or 3.',
            });
        }

        let whereCondition = {};

        if (createdFrom && createdTo) {
            whereCondition.createdAt = {
                [Op.between]: [new Date(createdFrom + ' 00:00:00'), new Date(createdTo + ' 23:59:59')],
            };
        } else if (createdFrom) {
            whereCondition.createdAt = { [Op.gte]: new Date(createdFrom + ' 00:00:00') };
        } else if (createdTo) {
            whereCondition.createdAt = { [Op.lte]: new Date(createdTo + ' 23:59:59') };
        }

        if (approvedFrom && approvedTo) {
            whereCondition.approvedAt = {
                [Op.between]: [new Date(approvedFrom + ' 00:00:00'), new Date(approvedTo + ' 23:59:59')],
            };
        } else if (approvedFrom) {
            whereCondition.approvedAt = { [Op.gte]: new Date(approvedFrom + ' 00:00:00') };
        } else if (approvedTo) {
            whereCondition.approvedAt = { [Op.lte]: new Date(approvedTo + ' 23:59:59') };
        }

        if (countryCode) whereCondition.countryCode = countryCode;
        if (mobile) whereCondition.mobile = mobile;
        if (phone) whereCondition.phone = phone;
        if (email) whereCondition.email = email;
        if (tenantStatus !== undefined) whereCondition.status = tenantStatus.toString();

        const tenantFilter = await findWithFilters.findWithFilters(body, db.Tenant);
        whereCondition = {
            ...whereCondition,
            ...tenantFilter.filterCondition,
        };

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const tenants = await db.Tenant.findAndCountAll({
            where: whereCondition,
            limit: parseInt(limit),
            offset: offset,
            order: [['createdAt', 'DESC']],
            transaction,
        });

        await transaction.commit();
        return res.status(status.OK).json({ data: tenants });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Tenant Filtration API', req, res);
    }
};

const db = require('../../../db/models');
const bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
const { status, common, enums, findWithFilters, removeImage } = require('../../../../utils');
const { Op } = require('sequelize');
const { default: axios } = require('axios');
const logActivity = require('../../../../utils/lib/auditLog/activityLogger');

// Login With password api with POS API
exports.loginWithPassword = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { body } = req;

        const userType = req.headers.usertype || 12;

        const user = await db.User.scope('withPassword').findOne({
            where: {
                email: body?.email,
            },
            include: [
                {
                    model: db.Role,
                    as: 'Role',
                    attributes: ['id', 'name'],
                    where: {
                        type: userType,
                    },
                },
                {
                    model: db.Tenant,
                    as: 'Tenant',
                    attributes: ['id'],
                },
            ],
            disableTenantCheck: true,
            transaction,
        });

        if (!user) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'User not found!' });
        }
        if (user.status == enums.Status.Inactive) {
            await transaction.rollback();
            return res.status(status.NotFound).json({
                message: 'You Account has been disabled. Please contact Admin',
            });
        }

        if (!bcrypt.compareSync(body.password, user.password)) {
            await transaction.rollback();
            return res.status(status.NotFound).json({
                message: 'Invalid credentials.',
            });
        }

        let userData = {
            id: user?.id,
            userName: user.firstName + ' ' + user.lastName,
            mobile: user?.mobile,
            email: user?.email,
            role: user.Role.name,
            profileImage: user?.profileImage,
        };

        let payload = {
            user: {
                id: user.id,
                email: user.email,
            },
        };

        let token = jwt.sign(payload, process.env.JWT_SECRET_ADMIN, {
            expiresIn: req.body.rememberMe ? process.env.TOKEN_EXPIRE_MAX : process.env.TOKEN_EXPIRE_MIN,
        });

        const userAgent = req.headers['user-agent'] || '';
        const isMobile = /Mobi|Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(userAgent);

        const latestLoginData = {
            userId: user ? user?.id : userData.id,
            loginAt: new Date(),
            logoutAt: null,
            sessionDuration: null,
            ipAddress: common.getUserIP(req),
            browserDetail: req.headers['user-agent'],
            isLogin: enums.isLogin.Login,
            deviceType: isMobile ? enums.deviceType.Mobile : enums.deviceType.Web,
            tenantId: user?.Tenant?.id,
            createdBy: user?.id,
        };

        const responseData = {
            message: 'Login Success',
            accessToken: token,
            userData: userData,
        };
        await db.LogLogin.create(latestLoginData, { transaction });

        await transaction.commit();
        return res.status(status.OK).json(responseData);
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Login User with Password POS api', req, res);
    }
};

// Login With auth api with POS API
exports.loginWithSocial = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { accessToken, type } = req.body;
        const userType = req.headers.usertype || 12;

        let data = {};
        if (type === enums.SocialLogin.Google) {
            const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            const userData = response.data;
            data.id = userData.sub;
            data.email = userData.email;
            data.name = userData.name;
            data.picture = userData.picture;
        } else if (type === enums.SocialLogin.Facebook) {
            const response = await axios.get(`${process.env.GRAPH_API_URL}/me`, {
                params: {
                    access_token: accessToken,
                    fields: 'id,name,email,picture',
                },
            });

            const userData = response.data;
            data.id = userData.id;
            data.email = userData.email;
            data.name = userData.name;
            data.picture = userData.picture;
        }
        const user = await db.User.findOne({
            where: {
                email: data.email,
            },
            include: [
                {
                    model: db.Role,
                    as: 'Role',
                    attributes: ['id', 'name', 'type'],
                    where: {
                        type: userType,
                    },
                },
                {
                    model: db.Tenant,
                    as: 'Tenant',
                    attributes: ['id'],
                },
            ],
            disableTenantCheck: true,
            transaction,
        });

        if (!user) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'User not found!' });
        }
        if (user.status == enums.Status.Inactive) {
            await transaction.rollback();
            return res.status(status.NotFound).json({
                message: "You're Account has been disabled. Please contact Admin",
            });
        }

        let userData = {
            id: user?.id,
            userName: user.firstName + ' ' + user.lastName,
            mobile: user?.mobile,
            email: user?.email,
            role: user.Role.name,
            profileImage: user?.profileImage,
        };

        let payload = {
            user: {
                id: user.id,
                email: user.email,
            },
        };

        let token = jwt.sign(payload, process.env.JWT_SECRET_ADMIN, {
            expiresIn: req.body.rememberMe ? process.env.TOKEN_EXPIRE_MAX : process.env.TOKEN_EXPIRE_MIN,
        });

        const userAgent = req.headers['user-agent'] || '';
        const isMobile = /Mobi|Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(userAgent);

        const latestLoginData = {
            userId: user ? user?.id : userData.id,
            loginAt: new Date(),
            logoutAt: null,
            sessionDuration: null,
            ipAddress: common.getUserIP(req),
            browserDetail: req.headers['user-agent'],
            isLogin: enums.isLogin.Login,
            deviceType: isMobile ? enums.deviceType.Mobile : enums.deviceType.Web,
            tenantId: user.tenantId,
        };

        const responseData = {
            message: 'Login Success',
            accessToken: token,
            userData: userData,
        };
        await db.LogLogin.create(latestLoginData, { transaction });

        await transaction.commit();
        return res.status(status.OK).json(responseData);
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Login User with Social', req, res);
    }
};

// update password by token
exports.changePassword = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { body } = req;

        const decoded = jwt.verify(req?.headers?.authorization, process.env.JWT_SECRET_ADMIN);

        if (!bcrypt.compareSync(body.oldPassword, req.user.password)) {
            await transaction.rollback();
            return res.status(status.BadRequest).json({
                message: 'Incorrect Old Password',
            });
        }

        if (bcrypt.compareSync(body.newPassword, req.user.password)) {
            await transaction.rollback();
            return res.status(status.BadRequest).json({
                message: 'New Password cannot be same as Old Password credentials',
            });
        }

        if (body.newPassword !== body.confirmPassword) {
            await transaction.rollback();
            return res.status(status.BadRequest).json({
                message: 'New Password and Confirm Password do not match',
            });
        }

        req.user.set({
            password: body.newPassword,
            passwordShow: body.newPassword,
            updatedBy: req.user.id,
        });

        const payload = {
            user: {
                id: req.user.id,
                email: req.user.email,
                signature: req.user.password.slice(-16),
            },
        };

        const token = jwt.sign({ ...payload, exp: decoded?.exp || process.env.TOKEN_EXPIRE_MIN }, process.env.JWT_SECRET_ADMIN);

        await req.user.save();

        return res.status(status.OK).json({
            message: 'Password updated successfully.',
            accessToken: token,
        });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Update User Password POS api', req, res);
    }
};

// get all users
exports.userFiltration = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { user, body } = req;

        let userFilter = {};
        if (body) userFilter = await findWithFilters.findWithFilters(body, db.User);

        let whereCondition = {
            id: { [Op.ne]: user.id },
            ...userFilter.filterCondition,
        };

        const page = parseInt(body.page) || 1;
        const limit = parseInt(body.limit) || 10;

        const offset = (page - 1) * limit;

        const userData = await db.User.findAndCountAll({
            attributes: {
                exclude: ['passwordShow'],
            },
            where: whereCondition,
            limit,
            offset,
            include: [
                {
                    model: db.Tenant,
                    as: 'Tenant',
                    attributes: ['shortCode', 'companyName'],
                },
                {
                    model: db.Role,
                    as: 'Role',
                    attributes: ['id', 'name', 'isAdmin', 'type'],
                },
                {
                    model: db.GeoCountry,
                    as: 'GeoCountry',
                    attributes: ['name', 'countryCode'],
                },
                {
                    model: db.GeoState,
                    as: 'GeoState',
                    attributes: ['name', 'stateCode'],
                },
                {
                    model: db.GeoCity,
                    as: 'GeoCity',
                    attributes: ['name', 'cityCode'],
                },
                {
                    model: db.User,
                    as: 'CreatedByUser',
                    attributes: ['id', 'firstName', 'lastName', 'fullName'],
                },
                {
                    model: db.User,
                    as: 'UpdatedByUser',
                    attributes: ['id', 'firstName', 'lastName', 'fullName'],
                },
            ],
            order: [['createdAt', 'DESC']],
            disableTenantCheck: true,
            transaction,
        });

        await transaction.commit();
        return res.status(status.OK).json({
            data: userData,
        });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Get All Users POS api', req, res);
    }
};

// get filter options
exports.userForFilter = async (req, res) => {
    try {
        const commonData = [
            { value: 'firstName', label: 'First Name', type: 'text' },
            { value: 'lastName', label: 'Last Name', type: 'text' },
            { value: 'email', label: 'Email', type: 'text' },
            { value: 'mobile', label: 'Mobile', type: 'text' },
            { value: 'shortCode', label: 'Short Code', type: 'text' },
            { value: 'Role.name', label: 'Role', type: 'dropdown' },
            { value: 'gender', label: 'Gender', type: 'dropdown' },
            { value: 'countryCode', label: 'Country Code', type: 'text' },
            { value: 'countryId', label: 'Country', type: 'dropdown' },
            { value: 'stateId', label: 'State', type: 'dropdown' },
            { value: 'cityId', label: 'City', type: 'dropdown' },
            { value: 'address', label: 'Address', type: 'text' },
            { value: 'zipCode', label: 'Zip Code', type: 'text' },
            { value: 'birthDate', label: 'Birth Date', type: 'date' },
            { value: 'anniversaryDate', label: 'Anniversary Date', type: 'date' },
            { value: 'status', label: 'Status', type: 'dropdown' },
            { value: 'createdAt', label: 'Created At', type: 'date' },
        ];

        let roleSpecificData = [];
        if (req.user.Role.type === enums.roleType.AdminUser) {
            roleSpecificData = [
                { value: 'Tenant.companyName', label: 'Tenant', type: 'dropdown' },
                { value: 'Store.storeName', label: 'Store', type: 'dropdown' },
            ];
        } else if (req.user.Role.type === enums.roleType.Tenant) {
            roleSpecificData = [{ value: 'Store.storeName', label: 'Store', type: 'dropdown' }];
        }

        return res.status(status.OK).json({ data: [...roleSpecificData, ...commonData] });
    } catch (err) {
        return common.throwException(err, 'Get User For Filter', req, res);
    }
};

// get user by id
exports.findById = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        const userData = await db.User.findOne({
            where: { id },
            attributes: {
                exclude: ['passwordShow'],
            },
            include: [
                {
                    model: db.Tenant,
                    as: 'Tenant',
                    attributes: ['shortCode', 'companyName'],
                },
                {
                    model: db.Role,
                    as: 'Role',
                    attributes: ['id', 'name', 'isAdmin', 'type'],
                },
                {
                    model: db.GeoCountry,
                    as: 'GeoCountry',
                    attributes: ['name', 'countryCode'],
                },
                {
                    model: db.GeoState,
                    as: 'GeoState',
                    attributes: ['name', 'stateCode'],
                },
                {
                    model: db.GeoCity,
                    as: 'GeoCity',
                    attributes: ['name', 'cityCode'],
                },
                {
                    model: db.User,
                    as: 'CreatedByUser',
                    attributes: ['id', 'firstName', 'lastName', 'fullName'],
                },
                {
                    model: db.User,
                    as: 'UpdatedByUser',
                    attributes: ['id', 'firstName', 'lastName', 'fullName'],
                },
            ],
            disableTenantCheck: true,
            transaction,
        });

        if (!userData) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'User not found!' });
        }

        await transaction.commit();
        return res.status(status.OK).json({ message: 'success', data: userData });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Get User POS Api', req, res);
    }
};

// create user
exports.create = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { body, file, user } = req;

        const checkExist = await db.User.findOne({
            where: {
                [Op.or]: [{ email: body?.email?.toLowerCase() }, { mobile: body?.mobile }],
                tenantId: user.tenantId,
            },
            disableTenantCheck: true,
            transaction,
        });

        if (checkExist) {
            await transaction.rollback();
            return res.status(status.Conflict).json({
                message: checkExist.email === body?.email?.toLowerCase() ? 'Email is already in use' : 'Mobile number is already in use',
            });
        }

        const checkRoleExist = await db.Role.findOne({
            where: {
                id: body.roleId,
                status: enums.Status.Active.value,
                tenantId: user.tenantId,
            },
            disableTenantCheck: true,
            transaction,
        });

        if (!checkRoleExist) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Role not found!' });
        }

        const userPayload = {
            firstName: body.firstName,
            lastName: body.lastName,
            mobile: body.mobile,
            email: body.email,
            password: body.password,
            passwordShow: body.password,
            storeId: user?.storeId,
            tenantId: user?.tenantId,
            roleId: body.roleId,
            shortCode: body.shortCode || 'MYCOPOS00010',
            gender: body.gender,
            countryCode: body.countryCode,
            profileImage: file ? `/${file.path.replace(/\\/g, '/')}` : null,
            address: body.address,
            countryId: body.countryId,
            stateId: body.stateId,
            cityId: body.cityId,
            zipCode: body.zipCode,
            notificationPlayerId: body.notificationPlayerId,
            deviceTokenId: body.deviceTokenId,
            birthDate: body.birthDate,
            anniversaryDate: body.anniversaryDate,
            createdBy: user.id,
        };

        await db.User.create(userPayload, { transaction });
        await logActivity(req, 'create', userPayload);

        await transaction.commit();
        return res.status(status.OK).json({ message: 'User created successfully' });
    } catch (err) {
        await transaction.rollback();
        if (req.file) removeImage(req.file.path);
        return common.throwException(err, 'Create User POS api', req, res);
    }
};

// update user
exports.update = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { params, body, file, user } = req;

        const checkExist = await db.User.findOne({
            where: {
                id: params.id,
            },
            disableTenantCheck: true,
            transaction,
        });

        if (!checkExist) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'User not found!' });
        }

        const checkEmailMobileExist = await db.User.findOne({
            where: {
                tenantId: user.tenantId,
                [Op.or]: [
                    {
                        [Op.and]: [
                            {
                                email: body?.email?.toLowerCase(),
                            },
                            {
                                id: { [Op.ne]: params.id },
                            },
                        ],
                    },
                    {
                        [Op.and]: [
                            {
                                mobile: body?.mobile,
                            },
                            {
                                id: { [Op.ne]: params.id },
                            },
                        ],
                    },
                ],
            },
            disableTenantCheck: true,
            transaction,
        });

        if (checkEmailMobileExist) {
            await transaction.rollback();
            return res.status(status.Conflict).json({
                status: false,
                message:
                    checkEmailMobileExist.email === body?.email?.toLowerCase()
                        ? 'Email is already in use'
                        : 'Mobile number is already in use',
            });
        }

        const checkRoleExist = await db.Role.findOne({
            where: {
                id: body.roleId,
                status: enums.Status.Active.value,
            },
            disableTenantCheck: true,
            transaction,
        });

        if (!checkRoleExist) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Role not found!' });
        }

        if ((file && checkExist.profileImage) || (!body.profileImage && checkExist.profileImage)) {
            removeImage(checkExist.profileImage);
            checkExist.profileImage = null;
        }
        const oldData = JSON.parse(JSON.stringify(checkExist.get({ plain: true })));

        const userPayload = {
            firstName: body.firstName,
            lastName: body.lastName,
            mobile: body.mobile,
            email: body.email,
            storeId: checkExist.storeId,
            tenantId: checkExist.tenantId,
            roleId: body.roleId || checkExist.roleId,
            shortCode: checkExist.shortCode,
            gender: body.gender,
            countryCode: body.countryCode || checkExist.countryCode,
            profileImage: file ? `/${file.path.replace(/\\/g, '/')}` : checkExist.profileImage,
            address: body.address || checkExist.address,
            countryId: body.countryId || checkExist.countryId,
            stateId: body.stateId || checkExist.stateId,
            cityId: body.cityId || checkExist.cityId,
            zipCode: body.zipCode || checkExist.zipCode,
            notificationPlayerId: body.notificationPlayerId || checkExist.notificationPlayerId,
            deviceTokenId: body.deviceTokenId || checkExist.deviceTokenId,
            birthDate: body.birthDate || checkExist.birthDate,
            anniversaryDate: body.anniversaryDate || checkExist.anniversaryDate,
            updatedBy: user.id,
        };

        await checkExist.set(userPayload, { transaction });

        await checkExist.save({ transaction });
        await transaction.commit();
        await logActivity(req, 'update', checkExist, oldData);
        return res.status(status.OK).json({ message: 'User updated successfully' });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Update User POS api', req, res);
    }
};

// delete user
exports.delete = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;

        const checkExist = await db.User.findOne({
            where: {
                id,
            },
            disableTenantCheck: true,
            transaction,
        });

        if (!checkExist) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'User not found!' });
        }

        if (checkExist.profileImage) {
            removeImage(checkExist.profileImage);
        }

        await checkExist.destroy({ transaction });
        await logActivity(req, 'delete', checkExist);

        await transaction.commit();
        return res.status(status.OK).json({ message: 'User deleted successfully' });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Delete User POS api', req, res);
    }
};
// update user status
exports.updateStatus = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { params, user } = req;

        const checkExist = await db.User.findOne({
            where: {
                id: params.id,
            },
            disableTenantCheck: true,
            transaction,
        });

        if (!checkExist) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'User not found!' });
        }
        const oldData = JSON.parse(JSON.stringify(checkExist.get({ plain: true })));

        checkExist.set(
            {
                status: checkExist.status === enums.Status.Active.value ? enums.Status.Inactive.value : enums.Status.Active.value,
                updatedBy: user.id,
            },
            { transaction }
        );

        await checkExist.save({ transaction });
        await transaction.commit();
        await logActivity(req, 'update', checkExist, oldData);
        return res.status(status.OK).json({ message: 'Status updated successfully' });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Update User Status POS api', req, res);
    }
};

const generateRandomPassword = (length = 8) => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

exports.forgotPassword = async (req, res) => {
    try {
        const { body } = req;

        if (!body?.email) {
            return res.status(status.BadRequest).json({ message: 'Email is required' });
        }

        // Check if user exists
        const user = await db.User.findOne({ where: { email: body?.email }, disableTenantCheck: true });

        if (!user) {
            return res.status(status.NotFound).json({ message: 'Invalid Email Address' });
        }

        // Generate new password
        const newPassword = generateRandomPassword();

        // Update password in the database
        await db.User.update(
            {
                password: newPassword,
                passwordShow: newPassword,
            },
            { where: { id: user.id } }
        );

        return res.status(status.OK).json({ message: 'Password Change Successfully' });
    } catch (err) {
        return common.throwException(err, 'Send Mail Api', req, res);
    }
};

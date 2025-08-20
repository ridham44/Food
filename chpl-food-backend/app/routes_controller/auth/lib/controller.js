const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../../../db/models');
const { status, findWithFilters } = require('../../../../utils');
const { Op } = require('sequelize');
const Enums = require('../../../../utils/lib/enums');
const common = require('../../../../utils/lib/common-function');

exports.customerlogin = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { identifier, otp } = req.body;
        const activeStatus = Enums.Status.get('Active').value;

        if (!identifier || !otp) {
            return res.status(status.BadRequest).json({ message: 'Email or mobile number and OTP are required.' });
        }

        const customer = await db.Customer.findOne({
            where: {
                [Op.or]: [{ email: identifier }, { phoneNo: identifier }],
                verified: activeStatus,
            },
        });

        if (!customer) {
            await transaction.rollback();
            return res.status(status.Unauthorized).json({ message: 'Invalid email or mobile number.' });
        }

        if (otp !== '1234') {
            await transaction.rollback();
            return res.status(status.Unauthorized).json({ message: 'Invalid OTP.' });
        }

        const token = jwt.sign({ user: { id: customer.id } }, process.env.JWT_SECRET_ADMIN, { expiresIn: '1d' });

        await transaction.commit();

        return res.status(status.OK).json({
            message: 'Login successful',
            accessToken: token,
            userData: {
                id: customer.id,
                email: customer.email,
                phoneNo: customer.phoneNo,
                fullName: `${customer.firstName} ${customer.lastName}`.trim(),
            },
        });
    } catch (error) {
        await transaction.rollback();
        return res.status(status.BadRequest).json({
            message: 'Login failed',
            error: error.message,
        });
    }
};

exports.create = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    const DEFAULT_CUSTOMER_ROLE_ID = '6cff3da0-02d8-11ef-8c8d-74563c33253';
    try {
        const { firstName, lastName, gender, email, phoneNo, address, cityId, stateId, countryCode, countryId, birthDate } = req.body;

        const existing = await db.Customer.findOne({
            where: {
                [Op.or]: [{ email }, { phoneNo }],
            },
        });

        if (existing) {
            return res.status(status.Conflict).json({ message: 'Customer with same email or phone already exists.' });
        }

        const customer = await db.Customer.create(
            {
                firstName,
                lastName,
                gender,
                email,
                phoneNo,
                verified: true,
                roleId: DEFAULT_CUSTOMER_ROLE_ID,
                address,
                countryId,
                cityId,
                stateId,
                countryCode,
                birthDate,
                createdAt: new Date(),
                createdBy: req.user?.id || null,
            },
            { transaction }
        );

        await transaction.commit();

        return res.status(status.OK).json({
            message: 'Customer created successfully',
            data: customer,
        });
    } catch (error) {
        await transaction.rollback();
        return res.status(status.BadRequest).json({
            message: 'Failed to create customer',
            error: error.message,
        });
    }
};

exports.update = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    const { id } = req.params;
    const { firstName, lastName, email, phoneNo, gender, birthDate, address, countryId, stateId, cityId, countryCode } = req.body;

    try {
        const customer = await db.Customer.findOne({ where: { id }, transaction });
        if (!customer) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Customer not found!' });
        }

        const existing = await db.Customer.findOne({
            where: {
                id: { [Op.ne]: id },
                phoneNo,
            },
            transaction,
        });
        if (existing) {
            await transaction.rollback();
            return res.status(status.Conflict).json({ message: 'Customer with this phone number already exists!' });
        }

        const updateData = {
            firstName,
            lastName,
            email,
            phoneNo,
            gender,
            birthDate,
            address,
            countryId,
            stateId,
            cityId,
            countryCode,
        };

        Object.keys(updateData).forEach((key) => {
            if (updateData[key] === undefined) delete updateData[key];
        });

        customer.set(updateData);
        await customer.save({ transaction });

        await transaction.commit();

        return res.status(status.OK).json({ message: 'Customer updated successfully!' });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Update Customer API', req, res);
    }
};

exports.delete = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        const customer = await db.Customer.findOne({ where: { id }, transaction });
        if (!customer) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Customer not found!' });
        }

        await db.Customer.destroy({ where: { id }, transaction });
        await transaction.commit();

        return res.status(status.OK).json({ message: 'Customer deleted successfully.' });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Delete Customer API', req, res);
    }
};

exports.login = async (req, res) => {
    const t = await db.sequelize.transaction();
    try {
        const { identifier, password } = req.body;
        const activeStatus = Enums.Status.get('Active').value;

        if (!identifier || !password) {
            return res.status(status.BadRequest).json({ message: 'Email or mobile number and password are required.' });
        }

        const user = await db.User.scope(['withPassword'])
            .unscoped()
            .findOne({
                where: {
                    [Op.or]: [{ email: identifier }, { mobile: identifier }],
                    status: activeStatus,
                },
                include: [
                    {
                        model: db.Role,
                        as: 'Role',
                        required: false,
                        where: { status: activeStatus },
                        disableTenantCheck: true,
                    },
                    {
                        model: db.Tenant,
                        as: 'Tenant',
                        required: false,
                        where: { status: activeStatus },
                        disableTenantCheck: true,
                    },
                ],
                disableTenantCheck: true,
            });

        if (!user) {
            return res.status(status.Unauthorized).json({ message: 'Invalid email or mobile number.' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(status.Unauthorized).json({ message: 'Invalid password.' });
        }

        const token = jwt.sign({ user: { id: user.id } }, process.env.JWT_SECRET_ADMIN, { expiresIn: '1d' });

        const userAgent = req.headers['user-agent'] || '';
        const isMobile = /Mobi|Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(userAgent);

        const latestLoginData = {
            userId: user.id,
            loginAt: new Date(),
            logoutAt: null,
            sessionDuration: null,
            ipAddress: common.getUserIP(req),
            browserDetail: userAgent,
            isLogin: Enums.isLogin.Login,
            deviceType: isMobile ? Enums.deviceType.Mobile : Enums.deviceType.Web,
            tenantId: user?.Tenant?.id,
            createdBy: user.id,
        };

        await db.LogLogin.create(latestLoginData, { transaction: t });

        await t.commit();

        return res.status(status.OK).json({
            message: 'Login successful',
            accessToken: token,
            userData: {
                id: user.id,
                email: user.email,
                mobile: user.mobile,
                role: user.Role ? user.Role.name : null,
                tenant: user.Tenant ? user.Tenant.name : null,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        await t.rollback();
        return res.status(status.InternalServerError).json({
            message: 'Login failed',
            error: error.message,
        });
    }
};

exports.changePassword = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { oldPassword, newPassword, confirmPassword } = req.body;
        const userId = req.user.id;

        const user = await db.User.scope('withPassword').findOne({
            where: { id: userId, status: Enums.Status.get('Active').value },
        });

        if (!user) {
            await transaction.rollback();
            return res.status(status.BadRequest).json({ message: 'User not found' });
        }

        const isOldPasswordValid = await bcrypt.compareSync(oldPassword, user.password);
        if (!isOldPasswordValid) {
            await transaction.rollback();
            return res.status(status.BadRequest).json({ message: 'Incorrect Old Password' });
        }
        if (oldPassword === newPassword) {
            await transaction.rollback();
            return res.status(status.BadRequest).json({ message: 'New Password cannot be same as Old Password' });
        }

        if (newPassword !== confirmPassword) {
            await transaction.rollback();
            return res.status(status.BadRequest).json({ message: 'New Password and Confirm Password do not match' });
        }

        user.set({
            password: newPassword,
            passwordShow: newPassword,
            updatedBy: user.id,
        });

        await user.save({ transaction });
        await transaction.commit();

        return res.status(status.OK).json({ message: 'Password updated successfully.' });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Change Password API', req, res);
    }
};

exports.filtration = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { fromDate, toDate, page = 1, limit = 10, gender, mobile, email, countryCode } = req.body;

        if ((fromDate && isNaN(Date.parse(fromDate))) || (toDate && isNaN(Date.parse(toDate)))) {
            return res.status(status.BadRequest).json({
                message: 'Invalid date format. Please use YYYY-MM-DD format for fromDate and toDate.',
            });
        }

        if (mobile !== undefined) {
            const mobileStr = mobile.toString();
            if (mobileStr.length < 8 || mobileStr.length > 15) {
                return res.status(status.BadRequest).json({
                    message: 'Invalid mobile number. Must be between 8 and 15 digits.',
                });
            }
            whereCondition.mobile = mobileStr;
        }

        if (email && !/^\S+@\S+\.\S+$/.test(email)) {
            return res.status(status.BadRequest).json({
                message: 'Invalid email format.',
            });
        }

        if (countryCode && (typeof countryCode !== 'string' || countryCode.length > 3)) {
            return res.status(status.BadRequest).json({
                message: 'Invalid country code. Max length is 3 characters.',
            });
        }

        let whereCondition = {};
        let userFilter = {};

        if (req.body) {
            userFilter = await findWithFilters.findWithFilters(req.body, db.User);
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

        if (gender) whereCondition.gender = gender;
        if (mobile) whereCondition.mobile = mobile;
        if (email) whereCondition.email = email;
        if (countryCode) whereCondition.countryCode = countryCode;

        whereCondition = {
            ...whereCondition,
            ...userFilter.filterCondition,
        };

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const users = await db.User.findAndCountAll({
            where: whereCondition,
            limit: parseInt(limit),
            offset: offset,
            order: [['createdAt', 'DESC']],
            transaction,
        });

        await transaction.commit();
        return res.status(status.OK).json({ data: users });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'User Date Filter API', req, res);
    }
};

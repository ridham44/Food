const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../../db/models');
const { status, findWithFilters } = require('../../../utils');
const { Op } = require('sequelize');
const Enums = require('../../../utils/lib/enums');
const common = require('../../../utils/lib/common-function');

exports.login = async (req, res) => {
    const t = await db.sequelize.transaction();
    try {
        const { identifier, password } = req.body;
        const activeStatus = Enums.Status.get('Active').value;

        if (!identifier || !password) {
            return res.status(status.BadRequest).json({ message: 'Email or mobile number and password are required.' });
        }

        const user = await db.User.scope(['withPassword', 'withoutTenant']).findOne({
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
        });

        if (!user) {
            return res.status(status.Unauthorized).json({ message: 'Invalid email or mobile number.' });
        }

        const passwordMatch = await bcrypt.compareSync(password, user.password);
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
        return res.status(status.ServerError || 500).json({
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

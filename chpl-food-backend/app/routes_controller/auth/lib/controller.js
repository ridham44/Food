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
                [Op.or]: [{ phoneNo }, ...(email ? [{ email }] : [])],
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
                roleType: user.Role ? user.Role.type : null,
                tenant: user.Tenant ? user.Tenant.companyName : null,
                tenantId: user.Tenant ? user.Tenant.id : null,
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

// Customer has no tenantId column — a tenant's customer list can only be
// derived via the orders they've placed with this tenant. Aggregated per
// customer from OrderList/OrderBill, scoped to req.user.tenantId. Written as
// a raw aggregate query — Sequelize's ORM-level `group` kept trying to pull
// non-aggregated columns into the SELECT list, which MySQL's stricter
// ONLY_FULL_GROUP_BY (Aiven's default; not every local MySQL enables it)
// rejects outright, so this groups explicitly by every selected column.
exports.customerList = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        if (!tenantId) {
            return res.status(status.Forbidden).json({ message: 'Tenant access only' });
        }
        const { search, page = 1, pageSize = 20 } = req.query;

        const replacements = { tenantId };
        let searchClause = '';
        if (search) {
            searchClause = 'AND (c.firstName LIKE :search OR c.lastName LIKE :search OR c.phoneNo LIKE :search)';
            replacements.search = `%${search}%`;
        }

        const rows = await db.sequelize.query(
            `
            SELECT
                ol.customerId AS id,
                CONCAT(c.firstName, ' ', c.lastName) AS name,
                c.phoneNo AS phone,
                c.email AS email,
                COUNT(ol.id) AS totalOrders,
                COALESCE(SUM(ob.finalAmount), 0) AS totalSpent,
                MAX(ol.createdAt) AS lastOrderAt
            FROM order_list ol
            INNER JOIN customer c ON c.id = ol.customerId
            LEFT JOIN order_bill ob ON ob.orderListId = ol.id
            WHERE ol.tenantId = :tenantId ${searchClause}
            GROUP BY ol.customerId, c.firstName, c.lastName, c.phoneNo, c.email
            ORDER BY MAX(ol.createdAt) DESC
            `,
            { replacements, type: db.Sequelize.QueryTypes.SELECT }
        );

        const total = rows.length;
        const limit = parseInt(pageSize) || 20;
        const offset = (parseInt(page) - 1) * limit;
        const paged = rows.slice(offset, offset + limit).map((r) => ({
            id: r.id,
            name: r.name?.trim() || null,
            phone: r.phone,
            email: r.email,
            totalOrders: parseInt(r.totalOrders, 10) || 0,
            totalSpent: parseFloat(r.totalSpent || 0),
            lastOrderAt: r.lastOrderAt,
        }));

        return res.status(status.OK).json({ data: { rows: paged, count: total } });
    } catch (error) {
        return common.throwException(error, 'Customer List API', req, res);
    }
};

// A customer's profile as seen by THIS tenant only — must never include
// orders the customer placed with other restaurants.
exports.customerProfile = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        if (!tenantId) {
            return res.status(status.Forbidden).json({ message: 'Tenant access only' });
        }
        const { id } = req.params;

        const customer = await db.Customer.findByPk(id, {
            attributes: ['id', 'firstName', 'lastName', 'phoneNo', 'email', 'gender', 'address'],
        });
        if (!customer) {
            return res.status(status.NotFound).json({ message: 'Customer not found' });
        }

        const orders = await db.OrderList.findAll({
            where: { tenantId, customerId: id },
            include: [
                {
                    model: db.OrderItem,
                    as: 'OrderItem',
                    attributes: ['menuId', 'quantity', 'totalPrice'],
                    disableTenantCheck: true,
                },
                {
                    model: db.OrderBill,
                    as: 'OrderBill',
                    attributes: ['finalAmount', 'status'],
                    required: false,
                    disableTenantCheck: true,
                },
            ],
            order: [['createdAt', 'DESC']],
        });

        const itemCounts = {};
        let totalSpent = 0;
        const orderHistory = orders.map((o) => {
            const plain = o.get({ plain: true });
            const bill = plain.OrderBill && plain.OrderBill[0] ? plain.OrderBill[0] : null;
            if (bill?.finalAmount) totalSpent += parseFloat(bill.finalAmount);
            (plain.OrderItem || []).forEach((item) => {
                if (!item.menuId) return;
                itemCounts[item.menuId] = (itemCounts[item.menuId] || 0) + item.quantity;
            });
            return {
                id: plain.id,
                status: plain.status,
                kitchenStatus: plain.kitchenStatus,
                total: bill ? parseFloat(bill.finalAmount) : null,
                createdAt: plain.createdAt,
            };
        });

        const topMenuIds = Object.entries(itemCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([menuId]) => menuId);

        const favoriteItems = topMenuIds.length
            ? await db.Menu.findAll({
                  where: { id: topMenuIds },
                  attributes: ['id', 'name'],
                  disableTenantCheck: true,
              })
            : [];

        return res.status(status.OK).json({
            data: {
                customer: {
                    id: customer.id,
                    name: `${customer.firstName} ${customer.lastName}`.trim(),
                    phone: customer.phoneNo,
                    email: customer.email,
                    gender: customer.gender,
                    address: customer.address,
                },
                totalOrders: orders.length,
                totalSpent,
                favoriteItems: favoriteItems.map((m) => ({ id: m.id, name: m.name, orderCount: itemCounts[m.id] })),
                orderHistory,
            },
        });
    } catch (error) {
        return common.throwException(error, 'Customer Profile API', req, res);
    }
};

exports.filtration = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { fromDate, toDate, page = 1, limit = 10, gender, mobile, email, countryCode } = req.body;
        let whereCondition = {};
        let userFilter = {};

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
        if (mobile) whereCondition.mobile = mobile.toString();
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

// Self-service profile for the customer app — scoped to the authenticated
// customer's own id via CustomerMiddlewear, never a client-supplied id.
exports.me = async (req, res) => {
    try {
        if (req.userType !== 'customer') {
            return res.status(status.Forbidden).json({ message: 'Customer access only' });
        }
        return res.status(status.OK).json({ data: req.user });
    } catch (error) {
        return common.throwException(error, 'Customer Me API', req, res);
    }
};

exports.updateMe = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        if (req.userType !== 'customer') {
            await transaction.rollback();
            return res.status(status.Forbidden).json({ message: 'Customer access only' });
        }

        const { firstName, lastName, email, phoneNo, gender, birthDate, address, countryId, stateId, cityId, countryCode } = req.body;

        const customer = await db.Customer.findOne({ where: { id: req.user.id }, transaction });
        if (!customer) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Customer not found!' });
        }

        if (phoneNo) {
            const existing = await db.Customer.findOne({
                where: { id: { [Op.ne]: customer.id }, phoneNo },
                transaction,
            });
            if (existing) {
                await transaction.rollback();
                return res.status(status.Conflict).json({ message: 'Customer with this phone number already exists!' });
            }
        }

        const updateData = { firstName, lastName, email, phoneNo, gender, birthDate, address, countryId, stateId, cityId, countryCode };
        Object.keys(updateData).forEach((key) => {
            if (updateData[key] === undefined) delete updateData[key];
        });

        customer.set(updateData);
        await customer.save({ transaction });

        await transaction.commit();
        return res.status(status.OK).json({ message: 'Profile updated successfully!', data: customer });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Customer Update Me API', req, res);
    }
};

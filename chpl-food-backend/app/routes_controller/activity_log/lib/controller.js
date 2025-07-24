const db = require('../../../db/models');
const { Op } = require('sequelize');
const { status } = require('../../../../utils');

function parseSafely(value) {
    if (!value) return null;
    try {
        if (typeof value === 'object') return value;
        return JSON.parse(value);
    } catch {
        return { error: 'Invalid JSON format' };
    }
}

function formatValueLog(action, valueObj, moduleName = '') {
    if (!valueObj || typeof valueObj !== 'object') return [];

    const lines = [];
    if (moduleName) lines.push(`Module: ${moduleName}`);

    if (action === 'update') {
        for (const [key, change] of Object.entries(valueObj)) {
            if (typeof change === 'object' && 'from' in change && 'to' in change) {
                const from = formatPrimitive(change.from);
                const to = formatPrimitive(change.to);
                lines.push(`${formatLabel(key)} was updated from ${from} to ${to}`);
            }
        }
    } else if (action === 'create') {
        for (const [key, val] of Object.entries(valueObj)) {
            lines.push(`${formatLabel(key)} was set to ${formatPrimitive(val)}`);
        }
    } else if (action === 'delete') {
        for (const [key, val] of Object.entries(valueObj)) {
            lines.push(`${formatLabel(key)} had value ${formatPrimitive(val)} before deletion`);
        }
    }

    return lines;
}

function formatPrimitive(value) {
    if (value === null || value === undefined || value === '') return 'blank value';
    if (typeof value === 'object') {
        if (value instanceof Date) return value.toISOString();
        return JSON.stringify(value);
    }
    return value.toString();
}

function formatLabel(key) {
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

exports.list = async (req, res) => {
    try {
        const { page = 1, limit = 10, module, action, startDate, endDate } = req.body;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const where = {};

        if (module) where.module = module;
        if (action) where.action = action;

        if (startDate && endDate) {
            where.createdAt = {
                [Op.between]: [new Date(`${startDate} 00:00:00`), new Date(`${endDate} 23:59:59`)],
            };
        } else if (startDate) {
            where.createdAt = { [Op.gte]: new Date(`${startDate} 00:00:00`) };
        } else if (endDate) {
            where.createdAt = { [Op.lte]: new Date(`${endDate} 23:59:59`) };
        }

        const { count, rows } = await db.activityLog.findAndCountAll({
            where,
            offset,
            limit: parseInt(limit),
            order: [['createdAt', 'DESC']],
        });

        const formattedRows = await Promise.all(
            rows.map(async (log) => {
                const logJson = log.toJSON();
                const parsedValue = parseSafely(logJson.value);
                const description = formatValueLog(logJson.action, parsedValue);

                let userInfo = null;

                if (logJson.userId) {
                   const user = await db.User.findByPk(logJson.userId, { disableTenantCheck: true });
                    if (user) {
                        userInfo = {
                            id: user.id,
                            name: `${user.firstName} ${user.lastName}`,
                            mobile: user.mobile || null,
                            email: user.email,
                            userType: 'User',
                        };
                    } else {
                        userInfo = {
                            id: logJson.userId,
                            name: 'Unknown User',
                            mobile: null,
                            email: null,
                            userType: 'User',
                        };
                    }
                } else if (logJson.customerId) {
                    const customer = await db.Customer.findByPk(logJson.customerId);
                    if (customer) {
                        userInfo = {
                            id: customer.id,
                            name: `${customer.firstName} ${customer.lastName}`,
                            mobile: customer.phoneNo,
                            userType: 'Customer',
                        };
                    } else {
                        userInfo = {
                            id: logJson.customerId,
                            name: 'Unknown Customer',
                            mobile: null,
                            userType: 'Customer',
                        };
                    }
                }

                const responseObj = {
                    id: logJson.id,
                    userId: logJson.userId,
                    customerId: logJson.customerId,
                    recordId: logJson.recordId,
                    createdAt: logJson.createdAt,
                    module: logJson.module,
                    action: logJson.action,
                    description,
                };

                if (logJson.action === 'create') responseObj.created_by = userInfo;
                if (logJson.action === 'update') responseObj.updated_by = userInfo;
                if (logJson.action === 'delete') responseObj.deleted_by = userInfo;

                return responseObj;
            })
        );

        return res.status(status.OK).json({
            message: 'Filtered activity logs fetched successfully',
            data: formattedRows,
            meta: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit),
            },
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            message: 'Something went wrong while fetching activity logs',
            error: error.message,
        });
    }
};

const db = require('../../../db/models');
const { Op } = require('sequelize');
const { status } = require('../../../../utils');

// Safely parse JSON value field
function parseSafely(value) {
    if (!value) return null;
    try {
        if (typeof value === 'object') return value;
        return JSON.parse(value);
    } catch {
        return { error: 'Invalid JSON format' };
    }
}

// Format activity description in plain text for Postman
function formatValueLog(action, valueObj, moduleName = '') {
    if (!valueObj || typeof valueObj !== 'object') return [];

    const lines = [];

    if (moduleName) {
        lines.push(`Module: ${moduleName}`);
    }

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
            where.created_at = {
                [Op.between]: [new Date(`${startDate} 00:00:00`), new Date(`${endDate} 23:59:59`)],
            };
        } else if (startDate) {
            where.created_at = { [Op.gte]: new Date(`${startDate} 00:00:00`) };
        } else if (endDate) {
            where.created_at = { [Op.lte]: new Date(`${endDate} 23:59:59`) };
        }

        const { count, rows } = await db.activityLog.findAndCountAll({
            where,
            offset,
            limit: parseInt(limit),
            order: [['created_at', 'DESC']],
            include: [
                {
                    model: db.User,
                    as: 'User',
                    attributes: ['id', 'firstName', 'lastName', 'email'],
                },
            ],
        });

        const formattedRows = rows.map((log) => {
            const logJson = log.toJSON();
            const parsedValue = parseSafely(logJson.value);
            const description = formatValueLog(logJson.action, parsedValue);

            return {
                id: logJson.id,
                user_id: logJson.user_id,
                record_id: logJson.record_id,
                created_at: logJson.created_at,
                query_updated_by: logJson.User,
                module: logJson.module,
                action: logJson.action,
               // value: parsedValue,
                description: description,
            };
        });

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

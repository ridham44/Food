const db = require('../../db/models');
const { Op } = require('sequelize');
const { status } = require('../../../utils');

function parseSafely(value) {
    if (!value) return null;
    try {
        if (typeof value === 'object') return value;
        return JSON.parse(value);
    } catch {
        return { error: 'Invalid JSON format' };
    }
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
            return {
                id: logJson.id,
                user_id: logJson.user_id,
                module: logJson.module,
                action: logJson.action,
                record_id: logJson.record_id,
                created_at: logJson.created_at,
                User: logJson.User,
                old_value: parseSafely(logJson.old_value),
                new_value: parseSafely(logJson.new_value),
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

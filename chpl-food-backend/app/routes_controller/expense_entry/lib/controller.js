const { status } = require('../../../../utils');
const db = require('../../../db/models');
const { Op, fn, col, literal } = require('sequelize');
const logActivity = require('../../../../utils/lib/auditLog/activityLogger');

exports.create = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const tenantId = req.user.tenantId;
        const userId = req.user.id;
        const { title, amount, date, category, paymentMode, remarks } = req.body;

        const entry = await db.ExpenseEntry.create(
            {
                title,
                amount,
                date,
                category,
                paymentMode,
                remarks,
                tenantId: tenantId,
                createdBy: userId,
                createdAt: new Date(),
            },
            { transaction }
        );

        await transaction.commit();
        await logActivity(req, 'create', entry);

        return res.status(status.OK).json({ message: 'Expense added successfully', data: entry });
    } catch (err) {
        await transaction.rollback();
        console.error('Create Expense Error:', err.message);
        return res.status(status.InternalServerError).json({ message: 'Something went wrong', error: err });
    }
};

exports.getAll = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;

        const expenses = await db.ExpenseEntry.findAll({
            where: { tenantId: tenantId },
            order: [['date', 'DESC']],
        });

        return res.status(status.OK).json({ message: 'Expense list fetched', data: expenses });
    } catch (err) {
        console.error('Get Expense Error:', err.message);
        return res.status(status.InternalServerError).json({ message: 'Something went wrong', error: err });
    }
};
exports.update = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const expenseId = req.params.id;
        const tenantId = req.user.tenantId;

        const expense = await db.ExpenseEntry.findOne({
            where: { id: expenseId, tenantId: tenantId },
        });

        if (!expense) {
            return res.status(status.NotFound).json({ message: 'Expense entry not found' });
        }
        const oldData = JSON.parse(JSON.stringify(expense.get({ plain: true })));

        const Expenseupdate = await expense.update(req.body, { transaction });

        await transaction.commit();
        await logActivity(req, 'update', Expenseupdate, oldData);

        return res.status(status.OK).json({ message: 'Expense entry updated', data: expense });
    } catch (err) {
        await transaction.rollback();
        console.error('Update Expense Error:', err.message);
        return res.status(status.InternalServerError).json({ message: 'Something went wrong', error: err });
    }
};

exports.remove = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const expenseId = req.params.id;
        const tenantId = req.user.tenantId;

        const expense = await db.ExpenseEntry.findOne({
            where: { id: expenseId, tenantId: tenantId },
        });

        if (!expense) {
            return res.status(status.NotFound).json({ message: 'Expense entry not found' });
        }

        await expense.destroy({ transaction });
        await transaction.commit();
        await logActivity(req, 'delete', expense);

        return res.status(status.OK).json({ message: 'Expense entry deleted successfully' });
    } catch (err) {
        await transaction.rollback();
        console.error('Delete Expense Error:', err.message);
        return res.status(status.InternalServerError).json({ message: 'Something went wrong', error: err });
    }
};

exports.expenseCategoryReport = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;

        let { from, to } = req.body;
        const whereClause = { tenantId };

        const parseDate = (value, isStart = true) => {
            if (!value) return null;
            const parts = value.split('-');
            if (parts.length === 1) {
                return isStart ? `${parts[0]}-01-01` : `${parts[0]}-12-31`;
            }
            if (parts.length === 2) {
                return isStart ? `${parts[0]}-${parts[1]}-01` : `${parts[0]}-${parts[1]}-31`;
            }
            return value;
        };

        const fromDate = parseDate(from, true);
        const toDate = parseDate(to, false);

        if (fromDate && toDate) {
            whereClause.date = { [Op.between]: [fromDate, toDate] };
        } else if (fromDate) {
            whereClause.date = { [Op.gte]: fromDate };
        } else if (toDate) {
            whereClause.date = { [Op.lte]: toDate };
        }

        const result = await db.ExpenseEntry.findAll({
            where: whereClause,
            attributes: ['category', [db.Sequelize.fn('SUM', db.Sequelize.col('amount')), 'total']],
            group: ['category'],
            order: [['createdAt', 'DESC']],
        });

        const formatted = result.map((item) => ({
            category: item.category,
            total: parseFloat(item.dataValues.total),
        }));

        const total = formatted.reduce((sum, curr) => sum + curr.total, 0);

        return res.status(status.OK).json({
            data: formatted,
            totalExpense: total,
        });
    } catch (error) {
        console.error(error.message);
        return res.status(status.InternalServerError).json({
            message: 'Something went wrong',
        });
    }
};

exports.expenseGroupedReport = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        let { from, to, category } = req.body;

        const parseDate = (value, isStart = true) => {
            if (!value) return null;
            const parts = value.split('-');
            if (parts.length === 1) return isStart ? `${value}-01-01` : `${value}-12-31`;
            if (parts.length === 2) return isStart ? `${value}-01` : `${value}-31`;
            return value;
        };

        const whereClause = { tenantId };
        const fromDate = parseDate(from, true);
        const toDate = parseDate(to, false);

        if (fromDate && toDate) whereClause.date = { [Op.between]: [fromDate, toDate] };
        else if (fromDate) whereClause.date = { [Op.gte]: fromDate };
        else if (toDate) whereClause.date = { [Op.lte]: toDate };

        if (category) whereClause.category = category;

        const records = await db.ExpenseEntry.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'title', 'amount', 'date', 'category', 'paymentMode', 'remarks'],
        });

        const grouped = {};
        let totalExpense = 0;

        records.forEach((r) => {
            const cat = r.category || 'Other';
            if (!grouped[cat]) {
                grouped[cat] = { category: cat, total: 0, entries: [] };
            }
            grouped[cat].entries.push({
                id: r.id,
                title: r.title,
                amount: r.amount,
                date: r.date.toISOString().split('T')[0],
                paymentMode: r.paymentMode,
                remarks: r.remarks,
            });
            grouped[cat].total += parseFloat(r.amount);
            totalExpense += parseFloat(r.amount);
        });

        const response = Object.values(grouped);

        return res.status(status.OK).json({
            data: response,
            totalExpense: parseFloat(totalExpense.toFixed(2)),
        });
    } catch (err) {
        console.error(err.message);
        return res.status(status.InternalServerError).json({
            message: 'Something went wrong',
        });
    }
};

exports.getExpenseReportCombo = async (req, res) => {
    try {
        const { days, months } = req.body;
        const tenantId = req.user.tenantId;

        if (!days && !months) {
            return res.status(status.BadRequest).json({ message: 'Please provide either "days" or "months" as query param.' });
        }

        let mode,
            result = {};

        const where = {
            tenantId,
        };

        if (days) {
            mode = 'days';
            const N = parseInt(days);
            const fromDate = new Date();
            fromDate.setDate(fromDate.getDate() - N + 1);

            where.createdAt = { [Op.gte]: fromDate };

            const dailyData = await db.ExpenseEntry.findAll({
                where,
                attributes: [
                    [fn('DATE', col('createdAt')), 'date'],
                    [fn('SUM', col('amount')), 'total'],
                ],
                group: [literal('DATE(createdAt)')],
                order: [[literal('DATE(createdAt)'), 'DESC']],
            });

            result = {
                mode: 'days',
                data: {
                    daily: dailyData.map((e) => ({
                        date: e.dataValues.date,
                        total: parseFloat(e.dataValues.total),
                    })),
                    total_days: N,
                },
            };
        }

        if (months) {
            mode = 'months';
            const N = parseInt(months);
            const fromDate = new Date();
            fromDate.setMonth(fromDate.getMonth() - N + 1);

            where.createdAt = { [Op.gte]: fromDate };

            const monthlyData = await db.ExpenseEntry.findAll({
                where,
                attributes: [
                    [fn('DATE_FORMAT', col('createdAt'), '%Y-%m'), 'month'],
                    [fn('SUM', col('amount')), 'total'],
                ],
                group: [literal("DATE_FORMAT(createdAt, '%Y-%m')")],
                order: [[literal("DATE_FORMAT(createdAt, '%Y-%m')"), 'DESC']],
            });

            result = {
                mode: mode,
                data: {
                    monthly: monthlyData.map((e) => ({
                        month: e.dataValues.month,
                        total: parseFloat(e.dataValues.total),
                    })),
                    total_months: N,
                },
            };
        }

        return res.status(status.OK).json(result);
    } catch (err) {
        console.error(err.message);
        return res.status(status.InternalServerError).json({ message: 'Error generating report.' });
    }
};

exports.expenseByPaymentMode = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { from, to } = req.query;

        if (!tenantId) {
            return res.status(status.BadRequest).json({ message: 'Tenant ID is missing from token.' });
        }

        let where = { tenantId };

        if (from) {
            const fromDate = new Date(from);
            if (!isNaN(fromDate)) {
                where.date = { [Op.gte]: fromDate };
            }
        }

        if (to) {
            const toDate = new Date(to);
            if (!isNaN(toDate)) {
                where.date = {
                    ...(where.date || {}),
                    [Op.lte]: toDate,
                };
            }
        }

        const data = await db.ExpenseEntry.findAll({
            where,
            attributes: ['paymentMode', [fn('SUM', col('amount')), 'total']],
            group: ['paymentMode'],
            raw: true,
        });

        const totalExpense = data.reduce((sum, row) => sum + parseFloat(row.total), 0);

        return res.status(status.OK).json({
            data: data.map((row) => ({
                paymentMode: row.paymentMode,
                total: parseFloat(row.total),
            })),
            total_expense: parseFloat(totalExpense.toFixed(2)),
        });
    } catch (err) {
        console.error('Expense report error:', err.message);
        return res.status(status.InternalServerError).json({ message: 'Failed to generate report.' });
    }
};

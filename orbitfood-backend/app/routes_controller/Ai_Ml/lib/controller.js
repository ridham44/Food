const db = require('../../../db/models');
const { status } = require('../../../../utils');
const MLR = require('ml-regression-multivariate-linear');

exports.salesForecast = async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const { days = 7 } = req.body;

        if (!tenantId) {
            return res.status(status.BadRequest).json({ message: 'Tenant ID is required' });
        }

        const orders = await db.OrderList.findAll({
            where: { tenantId },
            attributes: [],
            include: [
                {
                    model: db.OrderBill,
                    as: 'OrderBill',
                    attributes: [
                        [db.sequelize.fn('DATE', db.sequelize.col('OrderBill.createdAt')), 'date'],
                        [db.sequelize.fn('SUM', db.sequelize.col('OrderBill.finalAmount')), 'totalSales'],
                    ],
                    where: { status: '1' },
                    required: true,
                },
            ],
            group: [db.sequelize.fn('DATE', db.sequelize.col('OrderBill.createdAt'))],
            order: [[db.sequelize.fn('DATE', db.sequelize.col('OrderBill.createdAt')), 'ASC']],
            raw: true,
        });

        if (!orders.length) {
            return res.status(status.NotFound).json({ message: 'No sales data found for this tenant' });
        }

        const validOrders = orders
            .map((row) => ({
                date: row['OrderBill.date'],
                totalSales: Number(row['OrderBill.totalSales']),
            }))
            .filter((row) => row.totalSales != null && !isNaN(row.totalSales));

        // Need at least 2 points to forecast
        if (validOrders.length < 2) {
            return res.status(status.BadRequest).json({
                message: 'Not enough data for forecasting (need at least 2 days)',
            });
        }

        // Prepare training data
        const history = validOrders.map((row, index) => ({
            x: [index + 1],
            y: [row.totalSales],
        }));

        const X = history.map((item) => item.x);
        const Y = history.map((item) => item.y);

        // Train regression model
        const mlr = new MLR(X, Y);

        // Predict next N days
        const lastIndex = history.length;
        const forecast = [];
        for (let i = 1; i <= days; i++) {
            const predicted = mlr.predict([lastIndex + i])[0];
            forecast.push({
                day: i,
                predictedSales: Number(predicted.toFixed(2)),
            });
        }

        const formattedHistory = validOrders.map((row) => ({
            date: row.date,
            totalSales: row.totalSales.toFixed(2),
        }));

        return res.status(status.OK).json({
            history: formattedHistory,
            forecast,
        });
    } catch (err) {
        console.error(err.message);
        return res.status(status.InternalServerError).json({ message: 'Error generating forecast' });
    }
};

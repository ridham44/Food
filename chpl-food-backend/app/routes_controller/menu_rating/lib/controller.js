const db = require('../../../db/models');
const { status } = require('../../../../utils');
const { Op, Sequelize } = require('sequelize');
const logActivity = require('../../../../utils/lib/auditLog/activityLogger');

exports.submitMenuReview = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { orderId, reviews } = req.body;
        const customerId = req.user.id;

        if (!orderId || !Array.isArray(reviews)) {
            return res.status(status.BadRequest).json({
                message: 'Invalid request. Order ID and reviews array are required.',
            });
        }

        const order = await db.OrderList.findOne({ where: { id: orderId }, transaction });

        if (!order) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Order not found' });
        }

        if (order.customerId !== customerId) {
            await transaction.rollback();
            return res.status(status.Forbidden).json({
                message: 'You are not authorized to review this order.',
            });
        }

        const results = [];

        for (const review of reviews) {
            const { menuId, comboItemMenuId, rating, review: reviewText } = review;

            if (!menuId || !rating) {
                results.push({
                    menuId,
                    comboItemMenuId,
                    status: 'Invalid data',
                });
                continue;
            }

            const existingReview = await db.MenuRating.findOne({
                where: {
                    orderId,
                    menuId,
                    comboItemId: comboItemMenuId || null,
                    customerId,
                },
                transaction,
            });

            if (existingReview) {
                results.push({
                    menuId,
                    comboItemMenuId,
                    status: 'Rating already given',
                });
                continue;
            }

            const combo = await db.MenuRating.create(
                {
                    orderId,
                    menuId,
                    comboItemId: comboItemMenuId || null,
                    customerId,
                    rating,
                    review: reviewText,
                },
                { transaction }
            );

            results.push({
                menuId,
                comboItemMenuId,
                status: 'Rating submitted successfully',
            });

            await logActivity(req, 'create', combo);
        }

        await transaction.commit();
        return res.status(status.OK).json({
            message: 'Review processing completed',
            result: results,
        });
    } catch (error) {
        await transaction.rollback();
        console.error(error.message);
        return res.status(status.InternalServerError).json({
            message: 'Something went wrong',
            error: error.message,
        });
    }
};

exports.menuRatingReport = async (req, res) => {
    try {
        const { filter } = req.body;
        const tenantId = req.user.tenantId;

        let havingCondition = {};
        if (filter === 'high') {
            havingCondition = Sequelize.where(Sequelize.fn('AVG', Sequelize.col('rating')), {
                [Op.gte]: 4,
            });
        } else if (filter === 'medium') {
            havingCondition = Sequelize.and(
                Sequelize.where(Sequelize.fn('AVG', Sequelize.col('rating')), {
                    [Op.gte]: 2.5,
                }),
                Sequelize.where(Sequelize.fn('AVG', Sequelize.col('rating')), {
                    [Op.lt]: 4,
                })
            );
        } else if (filter === 'low') {
            havingCondition = Sequelize.where(Sequelize.fn('AVG', Sequelize.col('rating')), {
                [Op.lt]: 2.5,
            });
        }

        const ratings = await db.MenuRating.findAll({
            attributes: [
                'menuId',
                [Sequelize.fn('AVG', Sequelize.col('rating')), 'avgRating'],
                [Sequelize.fn('COUNT', Sequelize.col('rating')), 'totalReviews'],
            ],
            include: [
                {
                    model: db.Menu,
                    as: 'Menu',
                    attributes: ['name'],
                    where: tenantId ? { tenantId } : {},
                    required: true,
                    disableTenantCheck: true,
                },
            ],
            group: ['menuId', 'Menu.id', 'Menu.name'],
            having: havingCondition,
            raw: true,
            nest: true,
            order: [[Sequelize.literal('avgRating'), 'DESC']],
        });

        const formatted = ratings.map((r) => ({
            menuId: r.menuId,
            menuName: r.Menu.name,
            averageRating: parseFloat(parseFloat(r.avgRating).toFixed(1)),
            totalReviews: r.totalReviews,
        }));

        return res.status(status.OK).json({
            message: 'Menu rating report fetched successfully',
            data: formatted,
        });
    } catch (error) {
        console.error('Menu Rating Report Error:', error.message);
        return res.status(status.InternalServerError).json({
            message: 'Something went wrong',
            error: error.message,
        });
    }
};

exports.menuReviewDetails = async (req, res) => {
    try {
        const { menuId } = req.params;

        const menu = await db.Menu.findByPk(menuId);
        if (!menu) {
            return res.status(status.NotFound).json({ message: 'Menu not found' });
        }

        const reviews = await db.MenuRating.findAll({
            where: { menuId },
            include: [
                {
                    model: db.Customer,
                    as: 'Customer',
                    attributes: ['firstName', 'lastName'],
                },
            ],
            order: [['createdAt', 'DESC']],
        });

        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0 ? parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)) : 0;

        const formattedReviews = reviews.map((r) => ({
            customerName: r.Customer ? `${r.Customer.firstName} ${r.Customer.lastName || ''}`.trim() : 'Unknown',
            rating: r.rating,
            review: r.review,
            createdAt: r.createdAt,
        }));

        return res.status(status.OK).json({
            message: 'Menu review details fetched successfully',
            menuId,
            menuName: menu.name,
            averageRating,
            totalReviews,
            reviews: formattedReviews,
        });
    } catch (error) {
        console.error('Error fetching menu review details:', error.message);
        return res.status(status.InternalServerError).json({ message: 'Something went wrong', error: error.message });
    }
};

exports.comboMenuReport = async (req, res) => {
    try {
        const ratings = await db.MenuRating.findAll({
            where: {
                comboItemId: { [db.Sequelize.Op.ne]: null },
            },
            attributes: ['comboItemId', 'menuId', 'customerId', 'rating', 'review', 'createdAt'],
            raw: true,
        });

        if (ratings.length === 0) {
            return res.status(status.OK).json({ combos: [] });
        }

        const comboItemIds = [...new Set(ratings.map((r) => r.comboItemId))];
        const menuIds = [...new Set(ratings.map((r) => r.menuId))];
        const customerIds = [...new Set(ratings.map((r) => r.customerId))];

        const comboGroups = await db.ComboGroup.findAll({
            where: { id: comboItemIds },
            attributes: ['id', 'name'],
            raw: true,
        });

        const menus = await db.Menu.findAll({
            where: { id: menuIds },
            attributes: ['id', 'name'],
            raw: true,
            disableTenantCheck: true,
        });

        const users = await db.Customer.findAll({
            where: { id: customerIds },
            attributes: ['id', 'firstName', 'lastName'],
            raw: true,
        });

        const comboGroupMap = Object.fromEntries(comboGroups.map((group) => [group.id, group.name]));

        const menuMap = Object.fromEntries(menus.map((menu) => [menu.id, menu.name]));

        const userMap = Object.fromEntries(users.map((user) => [user.id, `${user.firstName} ${user.lastName || ''}`.trim()]));

        const comboMap = {};

        for (const r of ratings) {
            const comboItemId = r.comboItemId;
            const menuId = r.menuId;
            const customerName = userMap[r.customerId] || 'Unknown';
            const menuName = menuMap[menuId] || 'Unknown';
            const comboGroupName = comboGroupMap[comboItemId] || 'Unknown';

            if (!comboMap[comboItemId]) {
                comboMap[comboItemId] = {
                    comboItemId,
                    comboGroupName,
                    totalReviews: 0,
                    totalRating: 0,
                    menus: {},
                };
            }

            if (!comboMap[comboItemId].menus[menuName]) {
                comboMap[comboItemId].menus[menuName] = [];
            }

            comboMap[comboItemId].menus[menuName].push({
                customerName,
                rating: r.rating,
                review: r.review,
                createdAt: r.createdAt,
            });

            comboMap[comboItemId].totalReviews += 1;
            comboMap[comboItemId].totalRating += r.rating;
        }

        const output = Object.values(comboMap).map((combo) => ({
            comboItemId: combo.comboItemId,
            comboGroupName: combo.comboGroupName,
            totalReviews: combo.totalReviews,
            averageRating: Number((combo.totalRating / combo.totalReviews).toFixed(1)),
            ...Object.fromEntries(Object.entries(combo.menus).map(([menuName, reviews]) => [`reviews about ${menuName}`, reviews])),
        }));

        return res.status(status.OK).json({ combos: output });
    } catch (err) {
        console.error(err);
        return res.status(status.InternalServerError).json({ message: 'Something went wrong', error: err.message });
    }
};

exports.getCustomerReviewHistory = async (req, res) => {
    try {
        const { customerId } = req.params;

        const user = await db.Customer.findByPk(customerId, {
            attributes: ['firstName', 'lastName'],
        });

        if (!user) {
            return res.status(status.NotFound).json({ message: 'Customer not found' });
        }

        const reviews = await db.MenuRating.findAll({
            where: { customerId },
            include: [
                {
                    model: db.Menu,
                    as: 'Menu',
                    attributes: ['name'],
                },
            ],
            attributes: ['rating', 'review', 'createdAt'],
            order: [['createdAt', 'DESC']],
        });

        const customerName = `${user.firstName} ${user.lastName || ''}`.trim();

        const formattedReviews = reviews.map((r) => ({
            menuName: r.Menu?.name || 'Unknown',
            rating: r.rating,
            review: r.review,
            createdAt: r.createdAt,
        }));

        return res.status(status.OK).json({
            customerName,
            reviews: formattedReviews,
        });
    } catch (error) {
        console.error('Error in getCustomerReviewHistory:', error);
        return res.status(status.InternalServerError).json({
            message: 'Something went wrong',
            error: error.message,
        });
    }
};

exports.getRatingDistribution = async (req, res) => {
    try {
        const { menuId } = req.params;

        const menu = await db.Menu.findByPk(menuId, {
            attributes: ['name'],
        });

        if (!menu) {
            return res.status(status.NotFound).json({ message: 'Menu not found' });
        }

        const ratings = await db.MenuRating.findAll({
            where: { menuId },
            attributes: ['rating', [db.Sequelize.fn('COUNT', db.Sequelize.col('rating')), 'count']],
            group: ['rating'],
            raw: true,
        });

        const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        ratings.forEach((r) => {
            ratingDistribution[r.rating] = parseInt(r.count);
        });

        return res.status(status.OK).json({
            menuName: menu.name,
            ratingDistribution,
        });
    } catch (error) {
        console.error('Error in getRatingDistribution:', error);
        return res.status(status.InternalServerError).json({
            message: 'Something went wrong',
            error: error.message,
        });
    }
};

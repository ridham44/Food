const jwt = require('jsonwebtoken');
const db = require('../db/models');
const { status } = require('../../utils');
const { setContextValues } = require('../db/audit-logger/utils');

const authenticateCustomerOrTenant = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(status.Unauthorized).json({ message: 'Unauthorized access.' });
        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET_ADMIN);

        const userId = decoded?.user?.id;
        if (!userId) {
            return res.status(status.Unauthorized).json({ message: 'Unauthorized access.' });
        }

        const customer = await db.Customer.findOne({
            where: { id: userId },
            attributes: { exclude: ['createdAt', 'createdBy', 'updatedAt', 'updatedBy'] },
        });

        if (customer) {
            req.user = customer;
            req.userType = 'customer';
            return setContextValues(req, customer, next);
        }

        const user = await db.User.findOne({
            where: { id: userId },
            attributes: { exclude: ['password', 'passwordShow', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy'] },
            include: [
                {
                    model: db.Role,
                    as: 'Role',
                    attributes: ['id', 'name', 'type'],
                    where: {
                        type: '2',
                    },
                    required: true,
                },
                {
                    model: db.Tenant,
                    as: 'Tenant',
                    attributes: ['id'],
                    required: false,
                },
            ],
            disableTenantCheck: true,
        });

        if (!user) {
            return res.status(status.Unauthorized).json({ message: 'Unauthorized access.' });
        }

        req.user = user;
        req.userType = 'tenant';
        return setContextValues(req, user, next);
    } catch (err) {
        return res.status(status.Unauthorized).json({ message: 'Unauthorized access.' });
    }
};

module.exports = authenticateCustomerOrTenant;

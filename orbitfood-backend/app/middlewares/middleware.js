var jwt = require('jsonwebtoken');
const db = require('../db/models');
const { status } = require('../../utils');
const { setContextValues } = require('../db/audit-logger/utils');

const authenticateUser = async (req, res, next) => {
    try {
        var token = req.headers.authorization.split(' ')[1] || null;
        if (!token) {
            return res.status(status.Unauthorized).json({ message: 'Unauthorized access.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_ADMIN, { algorithms: ['HS256'] });

        if (!decoded) {
            return res.status(status.Unauthorized).json({ message: 'Unauthorized access.' });
        }
        const user = await db.User.scope('withPassword').findOne({
            attributes: {
                exclude: ['password', 'passwordShow', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy'],
            },
            where: { id: decoded.user.id, status: '1' },
            include: [
                {
                    model: db.Role,
                    as: 'Role',
                    attributes: ['id', 'name', 'isAdmin', 'type'],
                    where: {
                        status: '1',
                    },
                    required: false,
                },
                {
                    model: db.Tenant,
                    as: 'Tenant',
                    attributes: ['id'],
                    where: {
                        status: '1',
                    },
                    required: false,
                },
            ],
            disableTenantCheck: true,
        });
        if (!user) {
            return res.status(status.Unauthorized).json({
                message: 'Unauthorized access.',
            });
        }

        // Server-side session invalidation: reject tokens issued before the
        // user's last logout/password-change, even though the JWT itself
        // hasn't expired yet — otherwise "logout" only ever cleared client
        // state and a captured token stayed usable for its full lifetime.
        if (user.tokenValidAfter && decoded.iat * 1000 < new Date(user.tokenValidAfter).getTime()) {
            return res.status(status.Unauthorized).json({ message: 'Session expired. Please log in again.' });
        }

        // Add the current user instance in request.
        req.user = user;
        // let namespace = getNamespace(config.clsNamespace);
        return setContextValues(req, req.user, next);
    } catch (err) {
        return res.status(status.Unauthorized).json({ message: 'Unauthorized access.' });
    }
};

module.exports = authenticateUser;
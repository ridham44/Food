var jwt = require('jsonwebtoken');
const db = require('../db/models');
const { status } = require('../../utils');
const { setContextValues } = require('../db/audit-logger/utils');

const authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(status.Unauthorized).json({ message: 'Unauthorized: Missing or malformed token.' });
        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET_ADMIN);
        if (!decoded) {
            return res.status(status.Unauthorized).json({ message: 'Unauthorized: Invalid token.' });
        }
        
        console.log('Decoded token:', decoded);

        const user = await db.User.scope('withPassword').findOne({
            attributes: {
                exclude: ['password', 'passwordShow', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy'],
            },
            where: { id: decoded.user.id, status: '1' },
            include: [
                {
                    model: db.Role,
                    as: 'Role',
                    required: false,
                    attributes: ['id', 'name', 'isAdmin', 'type'],
                    where: {
                        status: '1',
                    },
                },
                {
                    model: db.Tenant,
                    as: 'Tenant',
                    required: false,
                    attributes: ['id'],
                    where: {
                        status: '1',
                    },
                },
            ],
            disableTenantCheck: true,
        });
        if (!user) {
            return res.status(status.Unauthorized).json({
                message: 'Unauthorized access not user.',
            });
        }

        // Add the current user instance in request.
        req.user = user;
        // let namespace = getNamespace(config.clsNamespace);
        return setContextValues(req, req.user, next);
    } catch (err) {
        return res.status(status.Unauthorized).json({ message: 'Unauthorized access.' + err.message });
    }
};

module.exports = authenticateUser;

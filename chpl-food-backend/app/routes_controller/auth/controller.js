const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../../db/models');
const { status } = require('../../../utils');
const { Op } = require('sequelize');
const Enums = require('../../../utils/lib/enums');

exports.login = async (req, res) => {
    try {
        const { identifier, password } = req.body;
        const activeStatus = Enums.Status.get('Active').value;

        if (!identifier || !password) {
            return res.status(status.BadRequest).json({ message: 'Email or mobile number and password are required.' });
        }

        const user = await db.User.scope(['withPassword', 'withoutTenant']).findOne({
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
        });

        if (!user) {
            return res.status(status.Unauthorized).json({ message: 'Invalid email or mobile number.' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(status.Unauthorized).json({ message: 'Invalid password.' });
        }

        const token = jwt.sign({ user: { id: user.id } }, process.env.JWT_SECRET_ADMIN, {
            expiresIn: '1d',
        });

        return res.status(status.OK).json({
            message: 'Login successful',
            token,
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(status.ServerError || 500).json({
            message: 'Login failed',
            error: error.message,
        });
    }
};

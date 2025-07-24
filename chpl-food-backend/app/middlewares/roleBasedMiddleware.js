const db = require('../db/models');
const { status } = require('../../utils');

module.exports = (menuKey) => {
    return async (req, res, next) => {
        try {
            const roleId = req.user.roleId;
            if (!roleId) {
                return res.status(status.BadRequest).json({ message: 'Role ID missing in token' });
            }

            const menu = await db.MenuAdmin.findOne({ where: { key: menuKey } });

            if (!menu) {
                return res.status(status.BadRequest).json({ message: 'Invalid menu key' });
            }

            const permission = await db.Permission.findOne({
                where: { roleId, menu_adminId: menu.id },
            });

            if (!permission) {
                return res.status(status.BadRequest).json({ message: 'Access denied.' });
            }

            next();
        } catch (err) {
            console.error('Role based acess Error:', err);
            return res.status(status.InternalServerError).json({ message: 'Internal server error' });
        }
    };
};

/** 
 * Usage Example:- Add this lines into index.js of your route
const  roleBasedMiddleware  = require('../../middlewares/roleBasedMiddleware');
router.get('/city', auth, roleBasedMiddleware('city.findAll'), controller.findAll);
 */

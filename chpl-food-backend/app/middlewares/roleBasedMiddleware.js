const db = require('../db/models');

module.exports = (menuKey) => {
    return async (req, res, next) => {
        try {
            const roleId = req.user.roleId;
            if (!roleId) {
                return res.status(403).json({ message: 'Role ID missing in token' });
            }

            const menu = await db.MenuAdmin.findOne({ where: { key: menuKey } });

            if (!menu) {
                return res.status(404).json({ message: 'Invalid menu key' });
            }

            const permission = await db.Permission.findOne({
                where: { roleId, menu_adminId: menu.id },
            });

            if (!permission) {
                return res.status(403).json({ message: 'Access denied.' });
            }

            next();
        } catch (err) {
            console.error('Role based acess Error:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
    };
};

/** 
 * Usage Example:- Add this lines into index.js of your route
const  roleBasedMiddleware  = require('../../middlewares/roleBasedMiddleware');
router.get('/city', auth, roleBasedMiddleware('city.findAll'), controller.findAll);
 */

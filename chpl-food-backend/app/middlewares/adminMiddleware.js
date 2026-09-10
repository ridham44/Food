const { status } = require('../../utils');

/**
 * Gate for platform-admin-only endpoints. Must run AFTER `middleware.js`'s
 * `auth` (which populates req.user.Role) — composed as
 * `router.get(path, auth, adminOnly, controller.fn)`.
 *
 * Role.type is the stable, structural signal for "platform admin"
 * ('1'=Admin, '2'=Tenant, '3'=Customer) — do NOT gate on role NAME
 * (e.g. `.includes('admin')`), since a tenant can freely name their own
 * staff role "Admin" and a name-based check would grant that tenant's
 * staff platform-wide admin powers.
 */
const adminOnly = (req, res, next) => {
    if (req.user?.Role?.type !== '1') {
        return res.status(status.Forbidden).json({ message: 'Admin access only.' });
    }
    next();
};

module.exports = adminOnly;

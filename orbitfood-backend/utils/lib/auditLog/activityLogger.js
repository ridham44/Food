const db = require('../../../app/db/models');

const logActivity = async (req, action, instance, oldValue = null) => {
    try {
        const userId = req?.user?.id;
        if (!userId || !instance) return;

        const ActivityLog = db.activityLog;
        if (!ActivityLog) return;

        const modelName = instance.constructor.name;
        const recordId = instance.id;

        let userType = 'user';
        let customerId = null;
        let userIdToSave = null;
        let tenantId = null;

        const user = await db.User.findByPk(userId, {
            attributes: ['id', 'roleId', 'tenantId'],
            disableTenantCheck: true,
        });

        if (user) {
            const role = await db.Role.findByPk(user.roleId, {
                attributes: ['type'],
            });

            if (role?.type === '3') {
                userType = 'customer';
                return userType
            }

            userIdToSave = userId;
            tenantId = user.tenantId || null;
        } else {
            const customer = await db.Customer.findByPk(userId, {
                attributes: ['id'],
            });

            if (customer) {
                customerId = customer.id;
            } else {
                return;
            }
        }

        let value = null;

        if (action === 'create') {
            value = instance.get({ plain: true });
        } else if (action === 'update') {
            const latestData = instance.get({ plain: true });
            const changedFields = {};

            for (const key in latestData) {
                if (['updatedAt', 'createdAt', 'id'].includes(key) || latestData[key] === undefined) continue;

                const oldVal = oldValue?.[key];
                const newVal = latestData[key];

                if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
                    changedFields[key] = {
                        from: oldVal,
                        to: newVal,
                    };
                }
            }

            if (Object.keys(changedFields).length === 0) return;

            value = changedFields;
        } else if (action === 'delete') {
            value = instance.get({ plain: true });
        }

        await ActivityLog.create({
            tenantId,
            userId: userIdToSave,
            customerId: customerId,
            module: modelName,
            action,
            recordId,
            value,
            createdAt: new Date(),
        });
    } catch (err) {
        console.error(`[ManualActivityLog] Failed for ${instance?.constructor?.name}:`, err);
    }
};

module.exports = logActivity;

const db = require('../../../app/db/models');

const logActivity = async (req, action, instance, oldValue = null) => {
    try {
        const userId = req?.user?.id;
        if (!userId || !instance) return;

        const ActivityLog = db.activityLog;
        if (!ActivityLog) return;

        const modelName = instance.constructor.name;
        const recordId = instance.id;

        let tenantId = req?.user?.tenantId;

        if (!tenantId && db.User) {
            const user = await db.User.findByPk(userId, { attributes: ['tenantId'] });
            tenantId = user?.tenantId;
        }   

        let newValue = null;
        let oldData = null;

        if (action === 'create') {
            newValue = instance.get({ plain: true });
        } else if (action === 'update') {
            const latestData = instance.get({ plain: true });
            newValue = {};
            oldData = {};
            for (const key in latestData) {
                if (['updatedAt', 'createdAt', 'id'].includes(key) || latestData[key] === undefined) continue;

                const oldVal = oldValue?.[key];
                const newVal = latestData[key];

                if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
                    oldData[key] = oldVal;
                    newValue[key] = newVal;
                }
            }

            if (Object.keys(newValue).length === 0) return;
        } else if (action === 'delete') {
            oldData = instance.get({ plain: true });
        }

        await ActivityLog.create({
            user_id: userId,
            tenant_id: tenantId,
            module: modelName,
            action,
            record_id: recordId,
            old_value: action === 'update' || action === 'delete' ? oldData : null,
            new_value: action === 'create' || action === 'update' ? newValue : null,
            created_at: new Date(),
        });
    } catch (err) {
        console.error(`[ManualActivityLog] Failed for ${instance?.constructor?.name}:`, err);
    }
};

module.exports = logActivity;

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

        let value = null;

        if (action === 'create') {
            const newValue = instance.get({ plain: true });
            value = newValue;
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
            const oldData = instance.get({ plain: true });
            value = oldData;
        }

        await ActivityLog.create({
            user_id: userId,
            tenant_id: tenantId,
            module: modelName,
            action,
            record_id: recordId,
            value,
            created_at: new Date(),
        });
    } catch (err) {
        console.error(`[ManualActivityLog] Failed for ${instance?.constructor?.name}:`, err);
    }
};

module.exports = logActivity;

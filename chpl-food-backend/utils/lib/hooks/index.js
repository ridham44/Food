const db = require('../../../app/db/models');

console.log('db', db);

const afterSaveHook = async (record, option) => {
    console.log('after save hook called');
    console.log('recorddddd', record);
    console.log('model', record.constructor.name);
    console.log('option', option);
    var myData = JSON.parse(JSON.stringify(record));
    console.log('myData', myData);
    try {
        let affectedColumnData = record?._changed ? [...record._changed] : [];
        let previousData = {};
        let newData = {};
        affectedColumnData.map((m1) => {
            previousData[m1] = record._previousDataValues[m1];
            newData[m1] = record.dataValues[m1];
        });
        let condition = {
            tableName: record.constructor.name,
            createdBy: myData.createdBy,
            routerIpAddress: null,
            localIpAddress: null,
            deviceName: null,
            operatingSystem: null,
            browser: null,
            userAgent: null,
        };
        if (record._options.isNewRecord == true) {
            condition.actionType = '1';
        } else {
            if (myData.deletedAt) {
                condition.actionType = '3';
            } else {
                condition.actionType = '2';
            }
        }
        let auditLog = await db.AuditLogs.create(condition);
        let auditDetailsData = {
            auditLogId: auditLog.id,
            newValues: newData,
            oldValues: previousData,
            affectedColumn: affectedColumnData,
        };
        await db.AuditLogsDetails.create(auditDetailsData);
    } catch (err) {
        console.log('eeeee', err);
        // this.throwException(err, 'Audit logs Create', null, null, null);
    }

    return;
};

module.exports = {
    afterSaveHook,
};

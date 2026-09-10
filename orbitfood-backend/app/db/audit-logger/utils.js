const { getNamespace } = require('cls-hooked');
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/config.json')[env];
// const _ = require('lodash');
const { performance } = require('perf_hooks');
// const db = require('../models');
const { common } = require('../../../utils/');
// const { getAPIOperation } = require('./helpers');

const setContextValues = (req, user = null, next) => {
    // check if audit logger is enabled else return.
    if (!config.enable) {
        return next();
    }

    let namespace = getNamespace(config.clsNamespace);

    // Adding the current user instance and request details in session context.
    namespace.set(config.clsUser, user?.toJSON());
    namespace.set(config.clsUserId, user?.id);
    namespace.set(config.tenantId, user?.tenantId);

    return next();
};

async function responseOverwrite(req, res, next) {
    try {
        req.startTime = performance.now();

        // check if audit logger is enabled else return.
        if (!config?.enable) {
            return next();
        }

        let namespace = getNamespace(config.clsNamespace);
        namespace.run(() => {
            namespace.set(config.clsStartTime, req.startTime);
            namespace.set(config.requestPath, req.originalUrl);
            namespace.set(config.clientIP, common.getUserIP(req));
            namespace.set(config.requestMethod, req.method);
            namespace.set(config.userAgent, req.headers['user-agent']);

            return next();
        });
    } catch (err) {
        await common.throwException(err, 'Update Audit Log Duration', req, res);
    }
}

module.exports = {
    setContextValues,
    // createAuditLog,
    responseOverwrite,
};

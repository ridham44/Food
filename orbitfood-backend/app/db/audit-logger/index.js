/* eslint-disable no-console */
var _sequelize = require('sequelize');
var _lodash = require('lodash');
const common = require('../../../utils/lib/common-function');
const { getNamespace } = require('cls-hooked');
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/config.json')[env];

exports.init = (sequelize) => {
    function beforeFind(hasTenant, canBeNull) {
        const beforeFind = async function beforeHook(instance) {
            try {
                let namespace = getNamespace(config.clsNamespace);
                const tenantId = namespace.get(config.tenantId);

                if (instance.disableTenantCheck) return true;

                instance.where = instance.where || {};

                // where tenantId is mandatory
                if (hasTenant && !canBeNull) instance.where['tenantId'] = tenantId;
                // where tenantId can be null
                if (hasTenant && canBeNull) {
                    // instance.required = true;
                    instance.where = {
                        ...instance.where,
                        [_sequelize.Op.or]: [
                            {
                                tenantId: tenantId,
                            },
                            {
                                tenantId: null,
                            },
                        ],
                    };
                    // console.log(Object.prototype.hasOwnProperty.call(instance.where, _sequelize.Op.or));
                }
                // console.log('instance.include', instance.include);
                if (instance.include && instance.include?.length > 0) {
                    instance?.include?.forEach((inc) => {
                        inc.required = false;
                        if (inc.as === 'CreatedByUser' || inc.as === 'UpdatedByUser') {
                            return false;
                        }
                        // console.log(inc.model.options.hasTenant);
                        let newHasTenant = inc.model.options.hasTenant;
                        let newCanBeNull = inc.model.options.canBeNull;

                        if ('tenantId' in inc.model.rawAttributes) {
                            // where tenantId is mandatory
                            if (newHasTenant && !newCanBeNull) {
                                if (inc.where) {
                                    inc.where['tenantId'] = tenantId;
                                } else {
                                    inc['where'] = {
                                        tenantId: tenantId,
                                    };
                                }
                            }

                            // where tenantId can be null
                            if (newHasTenant && newCanBeNull) {
                                inc.where = {
                                    ...inc.where,
                                    [_sequelize.Op.or]: [
                                        {
                                            tenantId: tenantId,
                                        },
                                        {
                                            tenantId: null,
                                        },
                                    ],
                                };
                            }
                        }
                    });
                }

                return true;
            } catch (error) {
                console.log(error);
                await common.throwException(error, 'Before Find All API');
            }
        };
        return beforeFind;
    }

    function beforeCreate(hasTenant) {
        const beforeCreate = async function beforeHook(instance, opt) {
            try {
                let namespace = getNamespace(config.clsNamespace);
                const tenantId = namespace.get(config.tenantId);

                if (hasTenant) {
                    if (Array.isArray(instance) && instance.length > 0) {
                        instance.forEach((ins) => {
                            ins.dataValues.tenantId = ins.dataValues.tenantId || tenantId;
                        });
                    } else {
                        instance.dataValues.tenantId = instance.dataValues.tenantId || tenantId;
                    }
                }

                return true;
            } catch (error) {
                console.log(error);
                await common.throwException(error, 'Before Create API');
            }
        };
        return beforeCreate;
    }

    _lodash.assignIn(_sequelize.Model, {
        hasTenantCondition: function hasAuditLogs(hasTenant = true, canBeNull = false) {
            this.options.hasTenant = hasTenant;
            this.options.canBeNull = canBeNull;
            this.addHook('beforeFind', beforeFind(hasTenant, canBeNull));

            this.addHook('beforeCount', beforeFind(hasTenant, canBeNull));

            this.addHook('beforeCreate', beforeCreate(hasTenant));

            this.addHook('beforeBulkCreate', beforeCreate(hasTenant));
            return true;
        },
    });
    //require('../../../utils/lib/auditLog/hookRegister');
    return true;
};

module.exports = exports;

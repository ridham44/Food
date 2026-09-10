/* eslint-disable no-inner-declarations */
// const { getNamespace } = require('cls-hooked');
const db = require('../../app/db/models');
// const { performance } = require('perf_hooks');
const common = require('./common-function');
// const _ = require('lodash');
const { status } = require('./messages/api.response');
const { Op } = require('sequelize');

// const env = process.env.NODE_ENV || 'development';
// const config = require(__dirname + '/../../app/db/audit-logger/config.json')[env];
const CryptoJS = require('crypto-js');
const passphrase = 'your_passphrase_here';

module.exports = {
    async getPermissionByToken(user) {
        try {
            let permissions = [];
            if (user?.Role?.isSystemAdmin) {
                permissions = await db.MenuOrder.findAll({
                    attributes: [['id', 'menuOrderId']],
                    raw: true,
                });
            } else {
                permissions = await db.Permission.findAll({
                    attributes: ['menuOrderId'],
                    where: {
                        roleId: user.roleId,
                    },
                    raw: true,
                });
            }
            const menuOrderIds = permissions.map((i) => i.menuOrderId);
            return menuOrderIds;
        } catch (err) {
            Promise.reject(err);
        }
    },

    // Bulk-updates rows by referenceField. Previously built a raw UPDATE by
    // string-concatenating row values straight into SQL (no escaping) — a
    // SQL-injection footgun for whoever wired it up next. Sequelize's
    // `.update()` parameterizes values, so this drives the exact same
    // per-row CASE-style update safely, one bound query per row.
    async bulkUpdate(dataToUpdate, modelName, referenceField, transaction) {
        const keys = Object.keys(dataToUpdate[0] || {}).filter((f1) => f1 !== referenceField);

        const results = await Promise.all(
            dataToUpdate.map((row) => {
                const fields = {};
                keys.forEach((key) => {
                    fields[key] = row[key] ?? null;
                });
                return modelName.update(fields, {
                    where: { [referenceField]: row[referenceField] },
                    transaction,
                });
            })
        );

        const metadata = results.reduce((sum, [affectedCount]) => sum + (affectedCount || 0), 0);
        return { results, metadata };
    },

    async hasAnyChildren(rowInstance, exclude = []) {
        try {
            // Get model name from row instance
            let modelName = rowInstance.constructor.name;

            // Get all associations for model
            let associations = db[modelName].associations;

            // Filtering only HasMany relation
            const hasManyAssociations = Object.values(associations).filter((association) => association.associationType === 'HasMany');

            // Get the associated model names
            const associatedModelData = hasManyAssociations.map((association) => {
                let data = {
                    model: association.target.name,
                    foreignKey: association.foreignKey,
                    count: association.accessors.count,
                };
                return data;
            });

            let childrenData = [];

            // Check if data exist for each HasMany relation
            for (const row of associatedModelData) {
                if (exclude.includes(row.model)) continue;
                let currentModel = db[row.model];
                let whereCondition = {};

                whereCondition[row.foreignKey] = rowInstance.id;
                if (Object.keys(currentModel.rawAttributes).includes('deletedAt')) {
                    whereCondition.deletedAt = null;
                }
                try {
                    let count = await currentModel.count({
                        where: {
                            ...whereCondition,
                        },
                    });
                    if (count != 0) {
                        // If row count > 0 then add in array
                        childrenData.push({
                            model: row.model,
                            childrenCount: count,
                        });

                        // Break loop when first relation with row count > 0 is found.
                        break;
                    }
                } catch (err) {
                    console.log('some error', err);
                }
            }

            let hasChildren = childrenData?.length > 0 ? true : false;
            return Promise.resolve({
                hasChildren: hasChildren,
                message: hasChildren ? `Data is associated with this ${modelName}` : 'No children available.',
            });
        } catch (err) {
            return Promise.reject(err);
        }
    },

    /**
     *
      @param {} children array of object with properties model, selector, and name(message)
     * Note: message is for the model we checking in.
     * @returns
     */
    async hasChildren(children = [], entityId, entityName = 'row') {
        try {
            const hasData = [];
            for (const child of children) {
                let currentModel = db[child.model];
                let whereCondition = {};

                whereCondition[child.selector] = entityId;

                if (Object.keys(currentModel.rawAttributes).includes('deletedAt')) {
                    whereCondition.deletedAt = null;
                }

                let countChildren = await currentModel.count({
                    where: {
                        ...whereCondition,
                    },
                });

                if (countChildren > 0) {
                    // If row count > 0 then add in array
                    hasData.push({
                        name: child.name,
                        count: countChildren,
                    });

                    // Break loop when first relation with row count > 0 is found.
                    break;
                }
            }

            if (hasData.length > 0)
                return new Object({
                    status: status.Conflict,
                    message: `${hasData[0].count} ${hasData[0].name} associated with this ${entityName}.`,
                });
            return new Object({
                status: status.OK,
                message: 'No conflict.',
            });
        } catch (error) {
            return Promise.reject(error);
        }
    },

    async getTeamMembers(user) {
        try {
            const userData = await db.User.findOne({ where: { id: user.id } });

            let memberArray = [];

            async function getMembersRecursive(userId) {
                const membersList = await db.SalesTeamMember.findAll({
                    attributes: ['id', 'userId'],
                    where: { reportingTo: userId },
                });

                if (membersList.length > 0) {
                    for (const member of membersList) {
                        memberArray.push(member.userId);
                        await getMembersRecursive(member.userId);
                    }
                }
            }

            await getMembersRecursive(userData.id);
            memberArray.push(userData.id);
            return memberArray;
        } catch (err) {
            console.log(err);
            throw err; // Throw error to be handled by the caller
        }
    },

    /*  async getTeamMembers(user) {
        try {
            const userData = await db.User.findOne({ where: { id: user.id } });

            let memberArray = new Array();
            const membersList = await db.SalesTeamMember.findAll({
                attributes: ['id', 'userId'],
                where: { reportingTo: userData.id },
            });
            if (membersList.length) {
                memberArray = membersList.map((member) => member.userId);
            }
            memberArray.push(userData.id);
            return memberArray;
        } catch (err) {
            console.log(err);
        }
    }, */

    //* Check if fields already in use or not
    async checkUniqueFields(input) {
        try {
            // const sampleInput = {
            //     model: db.User,
            //     id: null,
            //     fields: [
            //         {
            //             field: 'email',
            //             value: 'jay@gmail.com',
            //             name: 'Email',
            //         },
            //         {
            //             field: 'mobile',
            //             value: '4',
            //             name: 'Mobile',
            //         },
            //         {
            //             field: 'aadhaarCard',
            //             value: '4',
            //             name: 'Aadhaar Card',
            //         },
            //     ],
            // };

            let whereCondition = {};

            const fieldObj = {};

            input.fields.forEach((m1) => {
                fieldObj[m1.field] = m1.value;
            });
            whereCondition = {
                [Op.or]: fieldObj,
            };

            if (input?.exclude) {
                whereCondition.id = {
                    [Op.notIn]: input.exclude,
                };
            }

            const response = await db[input.model].findOne({
                where: {
                    deletedAt: null,
                    ...whereCondition,
                },
                raw: true,
            });

            if (response) {
                let notUnique = [];
                let errorFields = [];
                input.fields.forEach((m1) => {
                    if (m1.value == response[m1.field]) {
                        notUnique.push(m1.name);
                        errorFields.push({
                            type: 'field',
                            value: m1.value,
                            msg: m1.name + ' already in use.',
                            path: m1.field,
                            location: 'body',
                        });
                    }
                });

                return new Object({
                    status: status.BadRequest,
                    message: `${notUnique.join(', ')} already in use.`,
                    fields: errorFields,
                });
            }
            return new Object({
                status: status.OK,
            });
        } catch (err) {
            common.throwException(err, 'DB Common -> checkUniqueFields');
            return {
                status: status.BadRequest,
                message: err?.message || 'Something went wrong.',
            };
        }
    },

    // let enum name by value
    async getKeyByModuleValue(data, value) {
        return Object.keys(data).find((key) => data[key] === value);
    },

    // add deal stage and deposition status if tenant is new
    async newTenantDataCreateOnLogin(tenantId, transaction) {
        const dispositionStatus = await db.DispositionStatus.findOne({
            where: {
                deletedAt: null,
                tenantId: tenantId,
            },
            disableTenantCheck: true,
        });

        if (!dispositionStatus) {
            const depositionStatusData = {
                name: 'Customer',
                description: 'Customer',
                type: '0',
                isFinal: true,
                tenantId: tenantId,
            };

            try {
                await db.DispositionStatus.create(depositionStatusData, { transaction });
            } catch (error) {
                console.error('Error creating disposition status:', error);
                throw error; // Rethrow the error to handle it further up the chain
            }
        }

        return true;
    },

    generateSecret: async (length = 32) => {
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let secret = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charset.length);
            secret += charset[randomIndex];
        }

        return secret;
    },

    // Encrypt the secret
    encryptSecret: async (secret, passphrase) => {
        return CryptoJS.AES.encrypt(secret, passphrase).toString();
    },

    callSecrete: async () => {
        let data = await module.exports.generateSecret(); // Use module.exports to access methods
        let keyData = await module.exports.encryptSecret(data, passphrase);

        return keyData;
    },
};

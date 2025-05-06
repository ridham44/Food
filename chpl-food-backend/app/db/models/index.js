'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
// const auditConfig = require(__dirname + '/../audit-logger/config.json')[env];

const AuditLogs = require('../audit-logger/index');
const db = {};

let sequelize;

if (config.use_env_variable) {
    sequelize = new Sequelize(process.env.DATABASE, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT,
        operatorsAliases: 0,
        pool: {
            max: parseInt(process.env.POOL_MAX),
            min: parseInt(process.env.POOL_MIN),
            acquire: parseInt(process.env.POOL_ACQUIRE),
            idle: parseInt(process.env.POOL_IDLE),
        },
    });
} else {
    sequelize = new Sequelize(config.database, config.username, config.password, { ...config });
}

AuditLogs.init(sequelize);

fs.readdirSync(__dirname)
    .filter((file) => {
        return file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js';
    })
    .forEach((file) => {
        const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
        db[model.name] = model;
    });

// Looping all Models in db
Object.keys(db).forEach((modelName) => {
    // Current Model reference
    const currentModel = db[modelName];

    //** For Dynamic Associations */
    // Looping all columns in Model
    Object.keys(currentModel.rawAttributes).forEach((attributeName) => {
        // Current Column reference
        const currentColumn = currentModel.rawAttributes[attributeName];

        // Check if Column has association property
        if (Object.prototype.hasOwnProperty.call(currentColumn, 'association')) {
            // check if Column has association and has model, key, belongsToAlias
            if (
                Object.prototype.hasOwnProperty.call(currentColumn.association, 'model') &&
                Object.prototype.hasOwnProperty.call(currentColumn.association, 'key') &&
                Object.prototype.hasOwnProperty.call(currentColumn.association, 'belongsToAlias')
            ) {
                // Referenced Model
                const referencedModel = db[currentColumn.association.model];

                // Default Aliases for BelongsTo and HasMany relations
                let belongsToAlias = currentColumn.association.belongsToAlias;
                let hasManyAlias = `${currentModel.name}s`;
                let hasOneAlias = `${currentModel.name}`;

                // If association property has belongsToAlias than use that
                if (currentColumn.association.belongsToAlias) belongsToAlias = currentColumn.association.belongsToAlias;

                // If association property has hasManyAlias than use that
                if (currentColumn.association.hasManyAlias) hasManyAlias = currentColumn.association.hasManyAlias;

                // If association property has hasOneAlias than use that
                //* Note: If hasOneAlias is defined then hasManyAlias will not work
                if (currentColumn.association.hasOneAlias) hasOneAlias = currentColumn.association.hasOneAlias;

                let columnActions = {};
                if (currentColumn.association.onUpdate) columnActions.onUpdate = currentColumn.association.onUpdate;

                if (currentColumn.association.onDelete) columnActions.onDelete = currentColumn.association.onDelete;

                // Other Options
                let options = {};

                // If reference property has options add
                if (currentColumn.association?.options) options = currentColumn.association.options;

                currentModel.belongsTo(referencedModel, {
                    foreignKey: attributeName,
                    as: belongsToAlias,
                    ...columnActions,
                    ...options,
                });
                if (!currentColumn.association.hasOneAlias) {
                    referencedModel.hasMany(currentModel, {
                        foreignKey: attributeName,
                        as: hasManyAlias,
                    });
                } else {
                    referencedModel.hasOne(currentModel, {
                        foreignKey: attributeName,
                        as: hasOneAlias,
                    });
                }
            } else {
                console.log(`***SKIPPED* ${modelName} -> ${attributeName} references a model`);
            }
        }
    });

    //** For Dynamic User Columns with Association(CreatedBy, UpdatedBy, DeletedBy) */
    if (Object.prototype.hasOwnProperty.call(currentModel.options, 'customOptions')) {
        // Custom option reference
        let options = currentModel.options?.customOptions;

        // CratedBy Column
        if (options?.createdBy && options?.createdBy.value === true) {
            currentModel.belongsTo(db.User, {
                foreignKey: { name: 'createdBy', allowNull: true },
                onUpdate: options.createdBy.onUpdate || 'CASCADE',
                onDelete: options.createdBy.onDelete || 'RESTRICT',
                as: 'CreatedByUser',
            });
            db.User.hasMany(currentModel, {
                foreignKey: { name: 'createdBy', allowNull: true },
                as: `Created${currentModel.name}s`,
            });
        }

        // UpdatedBy Column
        if (options?.updatedBy && options?.updatedBy.value === true) {
            currentModel.belongsTo(db.User, {
                foreignKey: { name: 'updatedBy', allowNull: true },
                onUpdate: options.updatedBy.onUpdate || 'CASCADE',
                onDelete: options.updatedBy.onDelete || 'RESTRICT',
                as: 'UpdatedByUser',
            });
            db.User.hasMany(currentModel, {
                foreignKey: { name: 'updatedBy', allowNull: true },
                as: `UpdatedBy${currentModel.name}s`,
            });
        }

        // DeletedBy Column
        if (options?.deletedBy && options?.deletedBy.value === true) {
            currentModel.belongsTo(db.User, {
                foreignKey: { name: 'deletedBy', allowNull: true },
                onUpdate: options.deletedBy.onUpdate || 'CASCADE',
                onDelete: options.deletedBy.onDelete || 'RESTRICT',
                as: 'DeletedByUser',
            });
            db.User.hasMany(currentModel, {
                foreignKey: { name: 'deletedBy', allowNull: true },
                as: `Deleted${currentModel.name}s`,
            });
        }
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;

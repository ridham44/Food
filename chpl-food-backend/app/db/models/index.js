'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];

const AuditLogs = require('../audit-logger/index');
const db = {};

let sequelize;

if (config.use_env_variable) {
  sequelize = new Sequelize(
    process.env.DATABASE,
    process.env.DB_USERNAME,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      dialect: process.env.DB_DIALECT,
      pool: {
        max: parseInt(process.env.POOL_MAX),
        min: parseInt(process.env.POOL_MIN),
        acquire: parseInt(process.env.POOL_ACQUIRE),
        idle: parseInt(process.env.POOL_IDLE),
      },
      // Disable operatorsAliases as it's deprecated
      operatorsAliases: false,
    }
  );
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, {
    ...config,
    operatorsAliases: false,
  });
}

AuditLogs.init(sequelize);

// Load all models in this folder except this index.js
fs.readdirSync(__dirname)
  .filter((file) => {
    return file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js';
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Setup associations dynamically
Object.keys(db).forEach((modelName) => {
  const currentModel = db[modelName];

  // Loop through model attributes
  Object.keys(currentModel.rawAttributes).forEach((attributeName) => {
    const attribute = currentModel.rawAttributes[attributeName];

    // If attribute has association metadata
    if (attribute.association) {
      const assoc = attribute.association;

      if (assoc.model && assoc.key && assoc.belongsToAlias) {
        const referencedModel = db[assoc.model];
        if (!referencedModel) {
          console.warn(`Referenced model ${assoc.model} not found for association on ${modelName}.${attributeName}`);
          return;
        }

        // Aliases for belongsTo, hasMany, hasOne
        let belongsToAlias = assoc.belongsToAlias;
        let hasManyAlias = assoc.hasManyAlias || `${currentModel.name}s`;
        let hasOneAlias = assoc.hasOneAlias || `${currentModel.name}`;

        // Association options
        const options = {
          foreignKey: attributeName,
          as: belongsToAlias,
          onUpdate: assoc.onUpdate || 'CASCADE',
          onDelete: assoc.onDelete || 'RESTRICT',
          ...(assoc.options || {}),
        };

        // Create belongsTo association
        currentModel.belongsTo(referencedModel, options);

        // Create reverse association: hasMany or hasOne
        if (!assoc.hasOneAlias) {
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
      }
    }
  });

  // Setup audit associations if customOptions defined
  if (currentModel.options && currentModel.options.customOptions) {
    const opts = currentModel.options.customOptions;

    // createdBy
    if (opts.createdBy?.value === true) {
      currentModel.belongsTo(db.User, {
        foreignKey: { name: 'createdBy', allowNull: true },
        onUpdate: opts.createdBy.onUpdate || 'CASCADE',
        onDelete: opts.createdBy.onDelete || 'RESTRICT',
        as: 'CreatedByUser',
      });
      db.User.hasMany(currentModel, {
        foreignKey: { name: 'createdBy', allowNull: true },
        as: `Created${currentModel.name}s`,
      });
    }

    // updatedBy
    if (opts.updatedBy?.value === true) {
      currentModel.belongsTo(db.User, {
        foreignKey: { name: 'updatedBy', allowNull: true },
        onUpdate: opts.updatedBy.onUpdate || 'CASCADE',
        onDelete: opts.updatedBy.onDelete || 'RESTRICT',
        as: 'UpdatedByUser',
      });
      db.User.hasMany(currentModel, {
        foreignKey: { name: 'updatedBy', allowNull: true },
        as: `UpdatedBy${currentModel.name}s`,
      });
    }

    // deletedBy
    if (opts.deletedBy?.value === true) {
      currentModel.belongsTo(db.User, {
        foreignKey: { name: 'deletedBy', allowNull: true },
        onUpdate: opts.deletedBy.onUpdate || 'CASCADE',
        onDelete: opts.deletedBy.onDelete || 'RESTRICT',
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

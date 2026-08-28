require('dotenv').config();

module.exports = {
    development: {
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'mysql',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false,
            },
        },
        pool: { max: 100, min: 0, acquire: 30000, idle: 10000 },
        seederStorage: 'sequelize',
        migrationStorageTableName: 'SequelizeMeta',
        seederStorageTableName: 'sequelizeData',
        logging: false,
    },
    production: {
        username: process.env.PROD_DB_USERNAME,
        password: process.env.PROD_DB_PASSWORD,
        database: process.env.PROD_DB_NAME,
        host: process.env.PROD_DB_HOST,
        dialect: 'mysql',
        pool: { max: 100, min: 0, acquire: 30000, idle: 10000 },
        seederStorage: 'sequelize',
        migrationStorageTableName: 'SequelizeMeta',
        seederStorageTableName: 'sequelizeData',
        logging: false,
    },
};

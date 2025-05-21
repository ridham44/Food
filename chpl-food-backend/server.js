require('dotenv').config();
require('./utils/lib/cronjob/index');

// Get AuditLogger Config
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/app/db/audit-logger/config.json')[env];

const express = require('express');
// const helmet = require('helmet');
const app = express();
const httpServer = require('http').Server(app);
const bodyParser = require('body-parser');
const db = require('./app/db/models');
const cors = require('cors');
const compression = require('compression');
const fs = require('fs');
const { createNamespace } = require('cls-hooked');

//* Swagger Docs
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger.json');
var morgan = require('morgan');
const { responseOverwrite } = require('./app/db/audit-logger/utils');
// const { initSocket } = require('./app/routes_controller/myoperator/webSocket');

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

//* App Route Versions
const V1Routes = '/api/v1';

//* Creating Context Namespace - session.
//? If you need to change the namespace name. Make sure to also update in middleware.js and models/index.js
createNamespace(config.clsNamespace);
// initSocket(httpServer);

//* CRON Jobs
require('./schedule');

app.use(express.text());

// Time when request started
app.use((req, res, next) => {
    req.startTime = performance.now();
    next();
});

//* Response Compression
app.use(compression());

//* Helmet
// app.use(helmet());

//* Overwrite the default res.json method to enable API response tracking.
app.use(responseOverwrite);

//* Morgan
const accessLogs = fs.createWriteStream('./access.log', { flags: 'a' });
app.use(morgan(':remote-addr [:date[web]] :method :url :status - :response-time ms', { stream: accessLogs }));

//* Body Parser Options
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));

//* Checks if folders exist else create folders for static files
let folders = ['uploads'];
folders.forEach((f) => {
    if (!fs.existsSync(f)) {
        fs.mkdirSync(f);
    }
});

//* Static Files route
app.use('/uploads', express.static('uploads'));
app.use('/utils/icons', express.static('utils/icons'));

//* Sequelize Connection and Sync
db.sequelize
    .authenticate()
    .then(() => {
        console.log('DB connected!');
        // db.sequelize
        //     .sync({ force: false, alter: true })
        //     .then(() => {
        //         console.log('DB Synced!');
        //     })
        //     .catch((err) => {
        //         console.log(err);
        //         console.log('DB Synced Failed!: ', err.message);
        //     });
    })
    .catch((err) => {
        console.error('DB connection failed!', err.message);
    });

//* CORS Options
app.use(
    cors({
        origin: '*',
    })
);

//* App Routes
app.use('/api/v1', require('./app/routes_controller'));
app.use(V1Routes, require('./app/routes_controller'));

app.get('/', (req, res) => {
    return res.json({ message: 'Server running.', lastUpdated: '20/01/2025' });
});

//* Swagger Routes
if (process.env.NODE_ENV !== 'production') {
    app.use('/api-docs', swaggerUi.serve);
    app.get('/api-docs', swaggerUi.setup(swaggerDocument));
}

//* Server
httpServer.listen(process.env.PORT || 5000, function () {
    console.log('Magic happens on localhost:' + process.env.PORT);
});

require('dotenv').config();
require('./utils/lib/cronjob/index');

// Get AuditLogger Config
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/app/db/audit-logger/config.json')[env];

const express = require('express');
const helmet = require('helmet');
const app = express();
const httpServer = require('http').Server(app);
const bodyParser = require('body-parser');
const db = require('./app/db/models');
const cors = require('cors');
const compression = require('compression');
const fs = require('fs');
const path = require('path');
const { createNamespace } = require('cls-hooked');
const { generalLimiter } = require('./app/middlewares/rateLimiters');

//* Swagger Docs
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger.json');
var morgan = require('morgan');
const { responseOverwrite } = require('./app/db/audit-logger/utils');
// const { initSocket } = require('./app/routes_controller/myoperator/webSocket');

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

//* Helmet — CSP is left off since this is a JSON API (not server-rendered
//* HTML) and a default CSP would break the Swagger UI page; CORP is relaxed
//* to cross-origin so the frontend (a different origin/port) can still load
//* uploaded images/icons served from /uploads and /utils/icons.
app.use(
    helmet({
        contentSecurityPolicy: false,
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
);

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

//* CORS Options — allowlist instead of '*' so only our own frontend(s) can
//* call the API from a browser. Requests with no Origin header (curl,
//* Postman, server-to-server, mobile webviews) are still allowed through.
const normalizeOrigin = (origin) => origin && origin.replace(/\/$/, '');
const allowedOrigins = [process.env.CORS_ALLOW_TENNAT_URL, 'http://localhost:5173', 'http://localhost:4173']
    .map(normalizeOrigin)
    .filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(normalizeOrigin(origin))) {
                return callback(null, true);
            }
            return callback(new Error('Not allowed by CORS'));
        },
    })
);

//* Rate limiting — applied to all API routes; login/OTP and AI-chat routes
//* additionally layer on their own stricter limiters (see their routers).
app.use(V1Routes, generalLimiter);

//* App Routes
app.use(V1Routes, require('./app/routes_controller'));

// Serve the production React build from this same Node service. In local
// development Vite still runs independently and proxies API requests here.
const frontendDist = path.resolve(__dirname, '../chpl-food-frontend/dist');
if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get('*', (req, res) => res.sendFile(path.join(frontendDist, 'index.html')));
} else {
    app.get('/', (req, res) => {
        return res.json({ message: 'Server running.', lastUpdated: '20/01/2025' });
    });
}

//* Swagger Routes
if (process.env.NODE_ENV !== 'production') {
    app.use('/api-docs', swaggerUi.serve);
    app.get('/api-docs', swaggerUi.setup(swaggerDocument));
}

//* Server
httpServer.listen(process.env.PORT || 5000, function () {
    console.log('Magic happens on localhost:' + process.env.PORT);
});

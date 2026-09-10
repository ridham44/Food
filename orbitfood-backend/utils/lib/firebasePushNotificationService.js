// const axios = require('axios');
var admin = require('firebase-admin');
var serviceAccount = require('./firebaseAdminSDK.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const sendPushNotification = async (token, payload, handler = false) => {
    try {
        const message = {
            token: token, // Recipient device token
            notification: {
                title: payload.notification.title,
                body: payload.notification.body,
                image: payload?.notification?.image || '',
            },
            data: payload.data || {}, // Any additional data you want to send
        };
        const response = await admin.messaging().send(message);
        return response;
    } catch (err) {
        console.error('Service error:', err.message);
        if (handler) return err;
    }
};

module.exports = {
    sendPushNotification,
};

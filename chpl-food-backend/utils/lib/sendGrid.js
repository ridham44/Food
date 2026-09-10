// sendgrid
const sendgrid = require('@sendgrid/mail');

try {
    sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
} catch (err) {
    return console.log('Error initiating SendGrid.', err.message);
}

exports.sendMail = (message) => {
    message.from = process.env.SENDGRID_EMAIL;
    return new Promise((resolve, reject) => {
        /* eslint-disable no-unreachable */
        sendgrid.json(message).then(
            (res) => {
                return resolve();
            },
            (error) => {
                console.error('SendGrid Error: ', error?.message);
                return reject(error);
            }
        );
        /* eslint-disable no-unreachable */
    });
};

exports.mailTemplate = {
    welcomeTemplate: 'd-b2cb0ee3a3914001b8bd97b223a4060a',
    loginCredential: 'd-ec2328add8a34b14b36cf40a595e40bd',
    donorTemplate: 'd-bd9df71ea92f4a9a9e5cee36ca5d32ab',
    receiverTemplate: 'd-5bac0a314518475ea774da92b77d21e6',
};

const Razorpay = require('razorpay');

var instance;
try {
    instance = new Razorpay({ key_id: process.env.RAZORPAY_KEY, key_secret: process.env.RAZORPAY_SECRET });
} catch (err) {
    return console.log('Error initiating RazorPay.', err.message);
}

module.exports = {
    instance,
};

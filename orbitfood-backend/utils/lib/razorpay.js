const Razorpay = require('razorpay');

let instance;
try {
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        instance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
    } else {
        console.log('Razorpay not configured — RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET missing from env.');
    }
} catch (err) {
    console.log('Error initiating Razorpay.', err.message);
}

module.exports = {
    instance,
};

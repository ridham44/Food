const Stripe = require('stripe');

var instance;
try {
    instance = new Stripe(process.env.STRIPE_SECRET_KEY);
} catch (err) {
    return console.log('Error initiating Stripe.', err.message);
}

module.exports = {
    instance,
};

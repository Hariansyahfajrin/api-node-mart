const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();
const dotenv = require('dotenv');
dotenv.config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const midtransClient = require('midtrans-client');

// Function to generate a random 8-digit OTP
function generateOtp() {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

// Create Midtrans client instance
let midtrans = new midtransClient.Snap({
  isProduction: false, // Set to true for production environment
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

router.post('/midtrans', asyncHandler(async (req, res) => {
  try {
    const { amount, email, description } = req.body;

    // Generate OTP as order_id
    const order_id = generateOtp();

    // Define item details
    const itemDetails = {
      "id": order_id,
      "price": Number(amount), // Ensure amount is a number
      "quantity": 1,
      "name": description
    };

    // Define transaction parameters
    let parameter = {
      "transaction_details": {
        "order_id": order_id, // Use generated OTP
        "gross_amount": itemDetails.price // Total amount should match item details
      },
      "customer_details": {
        "email": email,
      },
      "item_details": [itemDetails]
    };

    // Create transaction
    const transaction = await midtrans.createTransaction(parameter);

    res.json({
      token: transaction.token,
      redirect_url: transaction.redirect_url
    });

  } catch (error) {
    console.error(error);
    return res.json({ error: true, message: error.message, data: null });
  }
}));

router.post('/stripe', asyncHandler(async (req, res) => {
  try {
    console.log('stripe');
    const { email, name, address, amount, currency, description } = req.body;

    const customer = await stripe.customers.create({
      email: email,
      name: name,
      address: address,
    });

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: '2023-10-16' }
    );

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      customer: customer.id,
      description: description,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });

  } catch (error) {
    console.log(error);
    return res.json({ error: true, message: error.message, data: null });
  }
}));

module.exports = router;

const db = require('../models');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.createPaymentIntent = async (req, res, next) => {
  try {
    const { planId, amount } = req.body;

    if (!planId && !amount) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID or amount is required'
      });
    }

    let paymentAmount = 0;
    let currency = 'usd';

    if (planId) {
      const plan = await db.Plan.findByPk(planId);
      if (!plan) {
        return res.status(404).json({
          success: false,
          message: 'Plan not found'
        });
      }
      paymentAmount = Math.round(parseFloat(plan.price) * 100); // Convert to cents
      currency = plan.currency.toLowerCase();
    } else {
      paymentAmount = Math.round(parseFloat(amount) * 100);
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Stripe not configured'
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: paymentAmount,
      currency: currency,
      metadata: {
        userId: req.user.id,
        planId: planId || null
      }
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.handleStripeWebhook = async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return res.status(400).send('Webhook secret not configured');
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      return res.status(400).send(`Webhook signature verification failed: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        const userId = paymentIntent.metadata.userId;
        const planId = paymentIntent.metadata.planId;

        if (userId && planId) {
          // Create transaction
          const plan = await db.Plan.findByPk(planId);
          await db.Transaction.create({
            userId,
            planId,
            type: 'subscription',
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency.toUpperCase(),
            status: 'completed',
            paymentMethod: 'credit_card',
            paymentGateway: 'stripe',
            paymentId: paymentIntent.id
          });

          // Activate subscription
          const subscription = await db.Subscription.findOne({
            where: {
              userId,
              planId,
              status: 'pending'
            }
          });

          if (subscription) {
            await subscription.update({ status: 'active' });
          }
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
};

exports.createPayPalOrder = async (req, res, next) => {
  try {
    const { planId } = req.body;

    const plan = await db.Plan.findByPk(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // This is a placeholder - implement PayPal SDK integration
    res.json({
      success: true,
      message: 'PayPal integration requires PayPal SDK setup',
      data: {
        planId: plan.id,
        amount: plan.price,
        currency: plan.currency
      }
    });
  } catch (error) {
    next(error);
  }
};


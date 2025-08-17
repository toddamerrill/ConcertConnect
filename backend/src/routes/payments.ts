import express from 'express';
import Stripe from 'stripe';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { ValidationError, NotFoundError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = express.Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
});

// Create payment intent for event ticket
router.post('/create-intent', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { eventId, amount, currency = 'usd', description } = req.body;

    if (!eventId || !amount) {
      throw new ValidationError('Event ID and amount are required');
    }

    if (amount < 50) { // Minimum $0.50
      throw new ValidationError('Amount must be at least $0.50');
    }

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      throw new NotFoundError('Event');
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Amount in cents
      currency: currency.toLowerCase(),
      description: description || `Ticket for ${event.title}`,
      metadata: {
        userId: req.user!.id,
        eventId: eventId,
        eventTitle: event.title || ''
      }
    });

    // Store payment record in database
    const payment = await prisma.payment.create({
      data: {
        userId: req.user!.id,
        eventId: eventId,
        stripePaymentId: paymentIntent.id,
        amount: Math.round(amount),
        currency: currency.toLowerCase(),
        status: 'pending',
        description: description || `Ticket for ${event.title}`,
        metadata: {
          eventTitle: event.title,
          venueName: event.venueName,
          eventDate: event.eventDate
        }
      }
    });

    logger.info(`Payment intent created for user ${req.user!.email}, event ${event.title}`);

    res.status(201).json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentId: payment.id,
        amount: payment.amount,
        currency: payment.currency
      }
    });
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      logger.error('Stripe error:', error);
      next(new ValidationError(`Payment error: ${error.message}`));
    } else {
      next(error);
    }
  }
});

// Confirm payment and update status
router.post('/confirm/:paymentId', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { paymentId } = req.params;

    // Find payment record
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        event: true
      }
    });

    if (!payment) {
      throw new NotFoundError('Payment');
    }

    if (payment.userId !== req.user!.id) {
      throw new ValidationError('Unauthorized to access this payment');
    }

    // Get payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment.stripePaymentId);

    // Update payment status based on Stripe status
    let status = 'pending';
    if (paymentIntent.status === 'succeeded') {
      status = 'succeeded';
    } else if (paymentIntent.status === 'canceled') {
      status = 'canceled';
    } else if (paymentIntent.status === 'requires_payment_method') {
      status = 'failed';
    }

    // Update payment record
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: { status }
    });

    // If payment succeeded, mark user as purchased for this event
    if (status === 'succeeded') {
      await prisma.userEvent.upsert({
        where: {
          userId_eventId_interactionType: {
            userId: req.user!.id,
            eventId: payment.eventId!,
            interactionType: 'purchased'
          }
        },
        update: {
          purchaseData: {
            paymentId: payment.id,
            amount: payment.amount,
            currency: payment.currency,
            purchaseDate: new Date()
          }
        },
        create: {
          userId: req.user!.id,
          eventId: payment.eventId!,
          interactionType: 'purchased',
          purchaseData: {
            paymentId: payment.id,
            amount: payment.amount,
            currency: payment.currency,
            purchaseDate: new Date()
          }
        }
      });

      logger.info(`Payment confirmed for user ${req.user!.email}, event ${payment.event?.title}`);
    }

    res.json({
      success: true,
      data: {
        payment: updatedPayment,
        stripeStatus: paymentIntent.status
      }
    });
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      logger.error('Stripe error:', error);
      next(new ValidationError(`Payment error: ${error.message}`));
    } else {
      next(error);
    }
  }
});

// Get user's payment history
router.get('/history', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { page = 0, limit = 20 } = req.query;

    const payments = await prisma.payment.findMany({
      where: {
        userId: req.user!.id
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            artistName: true,
            venueName: true,
            eventDate: true,
            imageUrl: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: parseInt(page as string) * parseInt(limit as string),
      take: parseInt(limit as string)
    });

    res.json({
      success: true,
      data: { payments }
    });
  } catch (error) {
    next(error);
  }
});

// Get payment by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            artistName: true,
            venueName: true,
            eventDate: true,
            imageUrl: true,
            ticketUrl: true
          }
        }
      }
    });

    if (!payment) {
      throw new NotFoundError('Payment');
    }

    if (payment.userId !== req.user!.id) {
      throw new ValidationError('Unauthorized to access this payment');
    }

    res.json({
      success: true,
      data: { payment }
    });
  } catch (error) {
    next(error);
  }
});

// Webhook endpoint for Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
      logger.error('Stripe webhook secret not configured');
      return res.status(400).send('Webhook secret not configured');
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig!, endpointSecret);
    } catch (err: any) {
      logger.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Update payment status in database
        await prisma.payment.updateMany({
          where: { stripePaymentId: paymentIntent.id },
          data: { status: 'succeeded' }
        });

        logger.info(`Payment succeeded: ${paymentIntent.id}`);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        
        await prisma.payment.updateMany({
          where: { stripePaymentId: failedPayment.id },
          data: { status: 'failed' }
        });

        logger.info(`Payment failed: ${failedPayment.id}`);
        break;

      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Webhook error:', error);
    res.status(500).send('Webhook error');
  }
});

export { router as paymentRoutes };
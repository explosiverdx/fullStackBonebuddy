import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay instance only if credentials are present
let razorpayInstance = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  console.log('✅ Razorpay configured successfully');
} else {
  console.warn('⚠️  Razorpay credentials not found. Payment features will be disabled.');
  console.warn('⚠️  Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env file.');
}

/**
 * Create a Razorpay order
 * @param {Number} amount - Amount in rupees (will be converted to paise)
 * @param {String} currency - Currency code (default: INR)
 * @param {String} receipt - Receipt ID for the order
 * @param {Object} notes - Additional notes for the order
 * @returns {Promise<Object>} - Razorpay order object
 */
export const createRazorpayOrder = async (amount, currency = 'INR', receipt, notes = {}) => {
  if (!razorpayInstance) {
    throw new Error('Razorpay is not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env file.');
  }

  try {
    const options = {
      amount: Math.round(amount * 100), // Convert to paise (smallest currency unit)
      currency,
      receipt,
      notes,
    };

    const order = await razorpayInstance.orders.create(options);
    return order;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
};

/**
 * Verify Razorpay payment signature
 * @param {String} orderId - Razorpay order ID
 * @param {String} paymentId - Razorpay payment ID
 * @param {String} signature - Razorpay signature
 * @returns {Boolean} - True if signature is valid
 */
export const verifyRazorpaySignature = (orderId, paymentId, signature) => {
  try {
    const text = `${orderId}|${paymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    return generatedSignature === signature;
  } catch (error) {
    console.error('Error verifying Razorpay signature:', error);
    return false;
  }
};

/**
 * Fetch payment details from Razorpay
 * @param {String} paymentId - Razorpay payment ID
 * @returns {Promise<Object>} - Payment details
 */
export const fetchPaymentDetails = async (paymentId) => {
  if (!razorpayInstance) {
    throw new Error('Razorpay is not configured.');
  }

  try {
    const payment = await razorpayInstance.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error('Error fetching payment details:', error);
    throw error;
  }
};

/**
 * Initiate refund for a payment
 * @param {String} paymentId - Razorpay payment ID
 * @param {Number} amount - Amount to refund in paise (optional, full refund if not provided)
 * @returns {Promise<Object>} - Refund details
 */
export const initiateRefund = async (paymentId, amount = null) => {
  if (!razorpayInstance) {
    throw new Error('Razorpay is not configured.');
  }

  try {
    const options = amount ? { amount: Math.round(amount * 100) } : {};
    const refund = await razorpayInstance.payments.refund(paymentId, options);
    return refund;
  } catch (error) {
    console.error('Error initiating refund:', error);
    throw error;
  }
};

/**
 * Verify webhook signature for Razorpay webhooks
 * @param {String} webhookBody - Raw webhook request body
 * @param {String} webhookSignature - Signature from webhook headers
 * @param {String} webhookSecret - Webhook secret configured in Razorpay dashboard
 * @returns {Boolean} - True if webhook is valid
 */
export const verifyWebhookSignature = (webhookBody, webhookSignature, webhookSecret) => {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(webhookBody)
      .digest('hex');

    return expectedSignature === webhookSignature;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
};

export default razorpayInstance;


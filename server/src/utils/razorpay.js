import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get directory path for .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Reload .env file to ensure env vars are available (PM2 issue)
const envPath = resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: true });
  console.log('🔄 Reloaded .env file for Razorpay');
} else {
  console.warn('⚠️  .env file not found at:', envPath);
}

// Initialize Razorpay instance only if credentials are present
let razorpayInstance = null;

// Function to initialize Razorpay (can be called multiple times)
const initializeRazorpay = () => {
  // Reload env vars each time to handle PM2 issues
  dotenv.config({ path: envPath, override: true });
  
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  
  if (keyId && keySecret) {
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
    console.log('✅ Razorpay configured successfully');
    return true;
  } else {
    console.warn('⚠️  Razorpay credentials not found. Payment features will be disabled.');
    console.warn('⚠️  Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env file.');
    console.warn('⚠️  Current env check:', { 
      hasKeyId: !!keyId, 
      hasKeySecret: !!keySecret 
    });
    razorpayInstance = null;
    return false;
  }
};

// Initialize on module load
initializeRazorpay();

/**
 * Create a Razorpay order
 * @param {Number} amount - Amount in rupees (will be converted to paise)
 * @param {String} currency - Currency code (default: INR)
 * @param {String} receipt - Receipt ID for the order
 * @param {Object} notes - Additional notes for the order
 * @returns {Promise<Object>} - Razorpay order object
 */
export const createRazorpayOrder = async (amount, currency = 'INR', receipt, notes = {}) => {
  // CRITICAL: Reload .env file before each operation (PM2 issue)
  // Same fix as Cloudinary - PM2 doesn't persist env vars at runtime
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
    console.log('🔄 Reloaded .env file for Razorpay order creation');
  }
  
  // Try to reinitialize if instance is null (handles PM2/env loading issues)
  if (!razorpayInstance) {
    console.log('🔄 Razorpay instance is null, attempting to reinitialize...');
    const initialized = initializeRazorpay();
    if (!initialized || !razorpayInstance) {
      console.error('❌ Razorpay configuration missing:', {
        has_key_id: !!process.env.RAZORPAY_KEY_ID,
        has_key_secret: !!process.env.RAZORPAY_KEY_SECRET,
        env_file_path: envPath,
        env_file_exists: fs.existsSync(envPath)
      });
      throw new Error('Razorpay is not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env file and restart the server.');
    }
  }
  
  // Also reinitialize if credentials might have changed
  const currentKeyId = process.env.RAZORPAY_KEY_ID;
  const currentKeySecret = process.env.RAZORPAY_KEY_SECRET;
  if (currentKeyId && currentKeySecret && (!razorpayInstance || razorpayInstance.key_id !== currentKeyId)) {
    console.log('🔄 Reinitializing Razorpay with fresh credentials...');
    initializeRazorpay();
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
    // Reload .env to ensure secret is available
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath, override: true });
    }
    
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      console.error('❌ RAZORPAY_KEY_SECRET not found for signature verification');
      return false;
    }
    
    const text = `${orderId}|${paymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
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
  // Reload .env before operation
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
  }
  
  if (!razorpayInstance) {
    const initialized = initializeRazorpay();
    if (!initialized || !razorpayInstance) {
      throw new Error('Razorpay is not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env file and restart the server.');
    }
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
  // Reload .env before operation
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
  }
  
  if (!razorpayInstance) {
    const initialized = initializeRazorpay();
    if (!initialized || !razorpayInstance) {
      throw new Error('Razorpay is not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env file and restart the server.');
    }
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


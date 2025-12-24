/**
 * Diagnostic script to check Razorpay configuration
 * Run this on your production server to verify Razorpay setup
 * 
 * Usage: node scripts/checkRazorpayConfig.js
 */

import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('🔍 Checking Razorpay Configuration...\n');

// Check environment variables
const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

console.log('Environment Variables:');
console.log('  RAZORPAY_KEY_ID:', keyId ? '✅ Set' : '❌ Missing');
console.log('  RAZORPAY_KEY_SECRET:', keySecret ? '✅ Set' : '❌ Missing');
console.log('');

if (!keyId || !keySecret) {
  console.error('❌ Razorpay configuration is incomplete!');
  console.error('Please set the following environment variables:');
  console.error('  - RAZORPAY_KEY_ID');
  console.error('  - RAZORPAY_KEY_SECRET');
  console.error('');
  console.error('You can get these from: https://dashboard.razorpay.com/app/keys');
  process.exit(1);
}

// Initialize Razorpay
let razorpayInstance;
try {
  razorpayInstance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
  console.log('✅ Razorpay instance created successfully');
  console.log('  Key ID:', keyId);
  console.log('');
} catch (error) {
  console.error('❌ Failed to create Razorpay instance:', error.message);
  process.exit(1);
}

// Test connection by fetching account details
try {
  console.log('Testing Razorpay connection...');
  
  // Try to fetch account details (this will verify credentials)
  // Note: Razorpay doesn't have a simple ping endpoint, so we'll try to create a test order
  const testOrder = await razorpayInstance.orders.create({
    amount: 100, // 1 rupee in paise
    currency: 'INR',
    receipt: `test_${Date.now()}`,
    notes: {
      test: 'true'
    }
  });
  
  console.log('✅ Razorpay connection successful!');
  console.log('  Test Order ID:', testOrder.id);
  console.log('  Order Status:', testOrder.status);
  console.log('');
  
  // Cancel/delete the test order (if possible)
  try {
    // Razorpay orders can't be cancelled, but that's okay for a test
    console.log('ℹ️  Test order created successfully (orders cannot be cancelled)');
  } catch (cancelError) {
    // Ignore cancel errors
  }
  
  console.log('✅ All checks passed! Razorpay is properly configured.');
  console.log('');
  console.log('📝 Next Steps:');
  console.log('  1. Make sure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are in your .env file');
  console.log('  2. Restart PM2 with --update-env flag: pm2 restart backend --update-env');
  console.log('  3. Check server logs to verify Razorpay is loaded at startup');
  
} catch (error) {
  console.error('❌ Razorpay connection failed!');
  console.error('  Error:', error.message);
  console.error('  Status Code:', error.statusCode || 'N/A');
  console.error('');
  console.error('Possible issues:');
  console.error('  1. Invalid Razorpay credentials');
  console.error('  2. Network connectivity issues');
  console.error('  3. Razorpay account suspended or expired');
  console.error('  4. Wrong environment (test vs live keys)');
  console.error('');
  console.error('Verify your credentials at: https://dashboard.razorpay.com/app/keys');
  process.exit(1);
}


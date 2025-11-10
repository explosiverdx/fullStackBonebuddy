/**
 * Razorpay Payment Integration Example
 * 
 * This file demonstrates how to use the Razorpay payment endpoints
 * Run this with: node --experimental-json-modules src/examples/payment-example.js
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api/v1'; // Adjust to your server URL
let authToken = ''; // Add your patient user token here

/**
 * Example 1: Get Razorpay Key
 */
async function getRazorpayKey() {
  try {
    const response = await axios.get(`${BASE_URL}/payments/razorpay/key`);
    console.log('✅ Razorpay Key:', response.data);
    return response.data.data.key;
  } catch (error) {
    console.error('❌ Error fetching Razorpay key:', error.response?.data || error.message);
  }
}

/**
 * Example 2: Create Razorpay Order
 */
async function createRazorpayOrder() {
  try {
    const orderData = {
      amount: 500, // Amount in rupees
      description: 'Test payment for consultation',
      paymentType: 'consultation',
      // appointmentId: 'optional_appointment_id',
      // sessionId: 'optional_session_id'
    };

    const response = await axios.post(
      `${BASE_URL}/payments/razorpay/order`,
      orderData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Order Created:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ Error creating order:', error.response?.data || error.message);
  }
}

/**
 * Example 3: Verify Payment (After successful payment from frontend)
 */
async function verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentId) {
  try {
    const verifyData = {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
      paymentId: paymentId
    };

    const response = await axios.post(
      `${BASE_URL}/payments/razorpay/verify`,
      verifyData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Payment Verified:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ Error verifying payment:', error.response?.data || error.message);
  }
}

/**
 * Example 4: Get Payment History
 */
async function getPaymentHistory(page = 1, limit = 10) {
  try {
    const response = await axios.get(
      `${BASE_URL}/payments?page=${page}&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    console.log('✅ Payment History:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ Error fetching payment history:', error.response?.data || error.message);
  }
}

/**
 * Example 5: Refund Payment (Admin/Doctor only)
 */
async function refundPayment(paymentId, amount = null) {
  try {
    const refundData = {
      paymentId,
      ...(amount && { amount }) // Optional partial refund amount
    };

    const response = await axios.post(
      `${BASE_URL}/payments/refund`,
      refundData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Refund Initiated:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ Error initiating refund:', error.response?.data || error.message);
  }
}

// Run examples
async function runExamples() {
  console.log('\n📝 Razorpay Integration Examples\n');
  console.log('=' .repeat(50));
  
  // Check if auth token is set
  if (!authToken) {
    console.log('\n⚠️  Please set your auth token in the authToken variable');
    console.log('   You can get a token by logging in as a patient user\n');
  }

  // Example 1: Get Razorpay Key (Public endpoint - no auth needed)
  console.log('\n1️⃣  Getting Razorpay Key...');
  await getRazorpayKey();

  // Example 2: Create Order (Requires auth)
  if (authToken) {
    console.log('\n2️⃣  Creating Razorpay Order...');
    const order = await createRazorpayOrder();

    // Example 3: Get Payment History
    console.log('\n3️⃣  Getting Payment History...');
    await getPaymentHistory();

    // Note: Payment verification happens after actual payment on frontend
    // Example 4: Verify Payment (commented out - needs actual Razorpay response)
    // console.log('\n4️⃣  Verifying Payment...');
    // await verifyPayment('order_xxx', 'pay_xxx', 'signature_xxx', 'payment_id');

    // Example 5: Refund (requires admin/doctor role)
    // console.log('\n5️⃣  Initiating Refund...');
    // await refundPayment('payment_id_here');
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ Examples completed!\n');
}

// Run the examples
runExamples();

/**
 * FRONTEND INTEGRATION SNIPPET
 * 
 * Add this to your frontend (React/Vue/HTML):
 * 
 * <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
 * 
 * const handlePayment = async () => {
 *   // 1. Create order
 *   const order = await createRazorpayOrder();
 *   
 *   // 2. Initialize Razorpay
 *   const options = {
 *     key: order.key,
 *     amount: order.amount,
 *     currency: order.currency,
 *     order_id: order.orderId,
 *     handler: async (response) => {
 *       // 3. Verify payment
 *       await verifyPayment(
 *         response.razorpay_order_id,
 *         response.razorpay_payment_id,
 *         response.razorpay_signature,
 *         order.paymentId
 *       );
 *     }
 *   };
 *   
 *   const razorpay = new Razorpay(options);
 *   razorpay.open();
 * };
 */


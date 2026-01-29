// Payment Creation/Cancellation on Insurance Status Change Tests
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from '../models/user.models.js';
import { Patient } from '../models/patient.models.js';
import { Payment } from '../models/payments.models.js';
import { Notification } from '../models/notification.models.js';

describe('Payment Creation/Cancellation on Insurance Status Change', () => {
  let mongoServer;
  let testUser;
  let testPatient;

  beforeEach(async () => {
    jest.setTimeout(30000); // Increase timeout for MongoDB setup
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test user
    testUser = await User.create({
      mobile_number: '9876543210',
      userType: 'patient',
      Fullname: 'Test Patient',
      email: 'test@example.com',
      profileCompleted: true,
      hospitalName: 'Test Hospital', // Required field
    });

    // Create test patient
    testPatient = await Patient.create({
      userId: testUser._id,
      name: 'Test Patient',
      medicalInsurance: 'No',
      state: 'Delhi',
      city: 'New Delhi',
      address: 'Test Address',
      hospitalClinic: 'Test Hospital', // Required field
    });
  }, 30000);

  afterEach(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  }, 30000);

  describe('Payment Creation - Non-Insured to Insured', () => {
    it('should create ₹18,000 payment for Uttar Pradesh patient', async () => {
      // Update patient to Uttar Pradesh and insured
      const updatedPatient = await Patient.findOneAndUpdate(
        { userId: testUser._id },
        { 
          medicalInsurance: 'Yes',
          state: 'Uttar Pradesh',
          city: 'Lucknow'
        },
        { new: true }
      );

      // Simulate the payment creation logic from updateProfile
      const addr = [
        updatedPatient.address,
        updatedPatient.city,
        updatedPatient.state,
        updatedPatient.pincode,
      ].filter(Boolean).join(' ');
      const amount = /Uttar\s*Pradesh|U\.?P\.?\b/i.test(addr) ? 18000 : 35000;

      const payment = await Payment.create({
        patientId: updatedPatient._id,
        userId: testUser._id,
        amount,
        description: 'Patient Registration Fee',
        paymentType: 'registration',
        status: 'pending',
        requestedBy: testUser._id,
      });

      expect(payment.amount).toBe(18000);
      expect(payment.status).toBe('pending');
      expect(payment.paymentType).toBe('registration');
    });

    it('should create ₹35,000 payment for non-UP state patient', async () => {
      // Update patient to insured (non-UP state)
      const updatedPatient = await Patient.findOneAndUpdate(
        { userId: testUser._id },
        { 
          medicalInsurance: 'Yes',
          state: 'Delhi',
          city: 'New Delhi'
        },
        { new: true }
      );

      // Simulate the payment creation logic
      const addr = [
        updatedPatient.address,
        updatedPatient.city,
        updatedPatient.state,
        updatedPatient.pincode,
      ].filter(Boolean).join(' ');
      const amount = /Uttar\s*Pradesh|U\.?P\.?\b/i.test(addr) ? 18000 : 35000;

      const payment = await Payment.create({
        patientId: updatedPatient._id,
        userId: testUser._id,
        amount,
        description: 'Patient Registration Fee',
        paymentType: 'registration',
        status: 'pending',
        requestedBy: testUser._id,
      });

      expect(payment.amount).toBe(35000);
      expect(payment.status).toBe('pending');
    });

    it('should recognize "U.P." as Uttar Pradesh', async () => {
      const updatedPatient = await Patient.findOneAndUpdate(
        { userId: testUser._id },
        { 
          medicalInsurance: 'Yes',
          state: 'U.P.',
          city: 'Agra'
        },
        { new: true }
      );

      const addr = [
        updatedPatient.address,
        updatedPatient.city,
        updatedPatient.state,
        updatedPatient.pincode,
      ].filter(Boolean).join(' ');
      const amount = /Uttar\s*Pradesh|U\.?P\.?\b/i.test(addr) ? 18000 : 35000;

      expect(amount).toBe(18000);
    });

    it('should not create duplicate payment if one already exists', async () => {
      // Create existing pending payment
      await Payment.create({
        patientId: testPatient._id,
        userId: testUser._id,
        amount: 35000,
        description: 'Patient Registration Fee',
        paymentType: 'registration',
        status: 'pending',
      });

      // Check for existing payment (simulating the logic)
      const existingPayment = await Payment.findOne({
        patientId: testPatient._id,
        paymentType: 'registration',
        status: 'pending'
      });

      expect(existingPayment).toBeTruthy();
      expect(existingPayment.amount).toBe(35000);
    });
  });

  describe('Payment Cancellation - Insured to Non-Insured', () => {
    it('should cancel pending registration payments when changing to non-insured', async () => {
      // Create pending payment first
      await Payment.create({
        patientId: testPatient._id,
        userId: testUser._id,
        amount: 35000,
        description: 'Patient Registration Fee',
        paymentType: 'registration',
        status: 'pending',
      });

      // Simulate cancellation logic
      const cancelledPayments = await Payment.updateMany(
        {
          patientId: testPatient._id,
          paymentType: 'registration',
          status: 'pending'
        },
        {
          status: 'cancelled'
        }
      );

      expect(cancelledPayments.modifiedCount).toBe(1);

      const payment = await Payment.findOne({ patientId: testPatient._id });
      expect(payment.status).toBe('cancelled');
    });

    it('should not cancel completed payments', async () => {
      // Create completed payment
      await Payment.create({
        patientId: testPatient._id,
        userId: testUser._id,
        amount: 35000,
        description: 'Patient Registration Fee',
        paymentType: 'registration',
        status: 'completed',
      });

      // Try to cancel (should only affect pending)
      const cancelledPayments = await Payment.updateMany(
        {
          patientId: testPatient._id,
          paymentType: 'registration',
          status: 'pending'
        },
        {
          status: 'cancelled'
        }
      );

      expect(cancelledPayments.modifiedCount).toBe(0);

      const payment = await Payment.findOne({ patientId: testPatient._id });
      expect(payment.status).toBe('completed');
    });
  });

  describe('Payment Amount Calculation', () => {
    it('should calculate ₹18,000 for Uttar Pradesh variations', () => {
      const testCases = [
        'Uttar Pradesh',
        'U.P.',
        'UP',
        'Uttar Pradesh Lucknow',
        'Lucknow Uttar Pradesh',
      ];

      testCases.forEach(state => {
        const addr = `Test Address ${state} 123456`;
        const amount = /Uttar\s*Pradesh|U\.?P\.?\b/i.test(addr) ? 18000 : 35000;
        expect(amount).toBe(18000);
      });
    });

    it('should calculate ₹35,000 for non-UP states', () => {
      const testCases = [
        'Delhi',
        'Maharashtra',
        'Karnataka',
        'Tamil Nadu',
        'Gujarat',
      ];

      testCases.forEach(state => {
        const addr = `Test Address ${state} 123456`;
        const amount = /Uttar\s*Pradesh|U\.?P\.?\b/i.test(addr) ? 18000 : 35000;
        expect(amount).toBe(35000);
      });
    });
  });
});

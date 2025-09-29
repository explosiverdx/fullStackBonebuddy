import dotenv from 'dotenv';
dotenv.config({ path: './env' });

import mongoose from 'mongoose';
import { User } from '../models/user.models.js';
import connectDB from '../db/index.js';
import { DB_NAME } from '../constants.js';

const checkNumber = async (phoneNumber) => {
  try {
    await connectDB();
    console.log('Connected to DB for checking number');

    const phoneDigits = phoneNumber.replace(/[^0-9]/g, '').slice(-10);
    const normalizedPhone = `+91${phoneDigits}`;

    const existingUser = await User.findOne({ mobile_number: { $in: [normalizedPhone, phoneDigits, `91${phoneDigits}`, phoneNumber] } });

    if (existingUser) {
      console.log(`User found: ${existingUser.mobile_number}, userType: ${existingUser.userType}, username: ${existingUser.username}`);
      if (existingUser.userType === 'admin') {
        console.log('This number is registered as admin.');
      } else {
        console.log('This number is registered but not as admin.');
      }
    } else {
      console.log('No user found with this number.');
    }

    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Query failed:', error);
    process.exit(1);
  }
};

// Get phone number from command line argument
const phoneNumber = process.argv[2];
if (!phoneNumber) {
  console.log('Usage: node checkNumber.js <phoneNumber>');
  process.exit(1);
}

checkNumber(phoneNumber);

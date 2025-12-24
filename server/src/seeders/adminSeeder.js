import mongoose from 'mongoose';
import { User } from '../models/user.models.js';
import { DB_NAME } from '../constants.js';
import dotenv from 'dotenv';
dotenv.config({path:'.env'});

async function seedAdmin() {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/Backend`);
    const adminUser = await User.create({
      mobile_number: '6387045470',
      userType: 'admin',
      username: 'admin_user',
      email: 'admin@bonebuddy.com',
      Fullname: 'Admin User',
      gender: 'Male',
      dateOfBirth: new Date('1990-01-01'),
      age: 34,
      address: {
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001'
      }
    });
    console.log('Admin user created:', adminUser.mobile_number);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
}

seedAdmin();

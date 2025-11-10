import mongoose from 'mongoose';
import { User } from '../models/user.models.js';
import dotenv from 'dotenv';
import connectDB from '../db/index.js';
dotenv.config({path:'../../.env'});

async function seedAdmin7080759888() {
  try {
    await connectDB();
    console.log('Connected to DB for seeding admin 7080759888');

    const mobileNumber = '7080759888';
    const existingAdmin = await User.findOne({ mobile_number: mobileNumber });

    if (existingAdmin) {
      console.log(`Admin with mobile number ${mobileNumber} already exists.`);
    } else {
      const adminUser = await User.create({
        mobile_number: mobileNumber,
        userType: 'admin',
        username: `admin_${mobileNumber}`,
        email: `admin${mobileNumber}@bonebuddy.com`,
        Fullname: `Admin ${mobileNumber}`,
        gender: 'Other',
        dateOfBirth: new Date('1990-01-01'),
        age: 34,
        address: {
          city: 'Unknown',
          state: 'Unknown',
          pincode: '000000'
        }
      });
      console.log('New admin user created:', adminUser.mobile_number);
    }
  } catch (error) {
    console.error('Error seeding new admin:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  }
}

seedAdmin7080759888();

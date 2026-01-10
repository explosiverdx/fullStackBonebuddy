import mongoose from 'mongoose';
import { User } from '../models/user.models.js';
import { DB_NAME } from '../constants.js';
import dotenv from 'dotenv';
dotenv.config({path:'.env'});

async function seedNewAdmin() {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/Backend`);
    const adminUser = await User.create({
      mobile_number: '9648832796',
      userType: 'admin',
      username: 'admin_9648832796',
      email: 'admin9648832796@bonebuddy.cloud',
      Fullname: 'Admin 9648832796',
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
    process.exit(0);
  } catch (error) {
    console.error('Error seeding new admin:', error);
    process.exit(1);
  }
}

seedNewAdmin();

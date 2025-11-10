import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

import mongoose from 'mongoose';
import { User } from '../models/user.models.js';
import connectDB from '../db/index.js';
import { DB_NAME } from '../constants.js';

const queryAdmins = async () => {
  try {
    await connectDB();
    console.log('Connected to DB for querying admins');

    const admins = await User.find({ userType: 'admin' }).select('mobile_number username email Fullname _id createdAt').lean();
    
    if (admins.length === 0) {
      console.log('No admin users found in the database.');
    } else {
      console.log('Admin users found:');
      admins.forEach(admin => {
        console.log(`- ID: ${admin._id}`);
        console.log(`  Mobile: ${admin.mobile_number}`);
        console.log(`  Username: ${admin.username || 'N/A'}`);
        console.log(`  Email: ${admin.email || 'N/A'}`);
        console.log(`  Fullname: ${admin.Fullname || 'N/A'}`);
        console.log(`  Created: ${admin.createdAt}`);
        console.log('');
      });
    }

    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Query failed:', error);
    process.exit(1);
  }
};

queryAdmins();

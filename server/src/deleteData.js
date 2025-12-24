import dotenv from 'dotenv';
dotenv.config({path:'./env'});

import mongoose from 'mongoose';
import { User } from './models/user.models.js';
import { Patient } from './models/patient.models.js';
import { DB_NAME } from './constants.js';

async function deleteAllData() {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    await User.deleteMany({});
    await Patient.deleteMany({});
    console.log('All users and patients deleted successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error deleting data:', error);
    process.exit(1);
  }
}

deleteAllData();

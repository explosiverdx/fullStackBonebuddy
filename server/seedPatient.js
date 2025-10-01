import mongoose from 'mongoose';
import { User } from './src/models/user.models.js';
import { DB_NAME } from './src/constants.js';
import dotenv from 'dotenv';
dotenv.config({path:'.env'});

async function seedPatient() {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    const patientUser = await User.create({
      mobile_number: '+918795737004',
      userType: 'patient',
      username: 'patient_user',
      email: 'patient@bonebuddy.com',
      Fullname: 'Patient User',
      gender: 'Male',
      dateOfBirth: new Date('1995-01-01'),
      age: 29,
      address: {
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001'
      },
      profileCompleted: false
    });
    console.log('Patient user created:', patientUser.mobile_number);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding patient:', error);
    process.exit(1);
  }
}

seedPatient();

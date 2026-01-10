import mongoose from 'mongoose';
import { User } from '../models/user.models.js';
import { Doctor } from '../models/doctor.models.js';
import dotenv from 'dotenv';
dotenv.config({path:'.env'});

async function seedDoctor() {
  try {
    await mongoose.connect(`mongodb://localhost:27017/bonebuddy`);

    // Create a doctor user
    const doctorUser = await User.create({
      mobile_number: '+919876543210',
      userType: 'doctor',
      email: 'info@bonebuddy.org',
      Fullname: 'Dr. John Doe',
      gender: 'Male',
      dateOfBirth: new Date('1980-01-01'),
      age: 44,
      address: {
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001'
      },
      specialization: 'Orthopedics',
      experience: 20,
      qualification: 'MBBS, MS Ortho',
      hospitalName: 'AIIMS Delhi'
    });

    // Create doctor profile
    const doctorProfile = await Doctor.create({
      userId: doctorUser._id,
      name: doctorUser.Fullname,
      qualification: doctorUser.qualification,
      specialization: doctorUser.specialization,
      experience: doctorUser.experience
    });

    console.log('Doctor user and profile created:', doctorUser.mobile_number, doctorProfile._id);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding doctor:', error);
    process.exit(1);
  }
}

seedDoctor();

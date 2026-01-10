import mongoose from 'mongoose';
import { User } from '../models/user.models.js';
import { Physio } from '../models/physio.models.js';
import dotenv from 'dotenv';
dotenv.config({path:'.env'});

async function seedPhysio() {
  try {
    await mongoose.connect(`mongodb://localhost:27017/bonebuddy`);

    // Create a physio user
    const physioUser = await User.create({
      mobile_number: '+919876543211',
      userType: 'physio',
      email: 'physio@bonebuddy.cloud',
      Fullname: 'Jane Smith',
      gender: 'Female',
      dateOfBirth: new Date('1985-05-15'),
      age: 39,
      address: {
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001'
      },
      specialization: 'Sports Physiotherapy',
      experience: 15,
      qualification: 'BPT, MPT',
      availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      availableTimeSlots: '9:00 AM - 5:00 PM',
      consultationFee: 1500,
      bio: 'Experienced physiotherapist specializing in sports injuries.'
    });

    // Create physio profile
    const physioProfile = await Physio.create({
      userId: physioUser._id,
      name: physioUser.Fullname,
      qualification: physioUser.qualification,
      specialization: physioUser.specialization,
      experience: physioUser.experience
    });

    console.log('Physio user and profile created:', physioUser.mobile_number, physioProfile._id);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding physio:', error);
    process.exit(1);
  }
}

seedPhysio();

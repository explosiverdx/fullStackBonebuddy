import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from '../models/user.models.js';
import connectDB from '../db/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function verifyAdmin() {
  try {
    await connectDB();
    console.log('\n=== Checking Admin User ===\n');

    const adminUser = await User.findOne({ username: 'admin' });
    
    if (adminUser) {
      console.log('✅ Admin user found!');
      console.log('   Username:', adminUser.username);
      console.log('   Email:', adminUser.email);
      console.log('   User Type:', adminUser.userType);
      console.log('   Has Password:', adminUser.password ? 'Yes' : 'No');
      console.log('   Mobile:', adminUser.mobile_number);
    } else {
      console.log('❌ Admin user with username "admin" not found');
      console.log('\nCreating admin user...\n');
      
      const newAdmin = await User.create({
        username: 'admin',
        password: 'BoneBuddy@96PhysioX&',
        userType: 'admin',
        Fullname: 'Admin',
        email: 'admin@bonebuddy.cloud',
        mobile_number: '9999999999',
        gender: 'Other',
        dateOfBirth: new Date('1990-01-01'),
        age: 34,
        address: 'Unknown'
      });
      
      console.log('✅ Admin user created!');
      console.log('   Username: admin');
      console.log('   Password: BoneBuddy@96PhysioX&');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 11000) {
      console.log('\n⚠️  Username or mobile number already exists. Updating existing user...\n');
      
      // Try to find and update
      const existingUser = await User.findOne({ 
        $or: [
          { username: 'admin' },
          { mobile_number: '9999999999' }
        ]
      });
      
      if (existingUser) {
        existingUser.username = 'admin';
        existingUser.password = 'BoneBuddy@96PhysioX&';
        existingUser.userType = 'admin';
        if (!existingUser.Fullname) existingUser.Fullname = 'Admin';
        if (!existingUser.email) existingUser.email = 'admin@bonebuddy.cloud';
        await existingUser.save();
        console.log('✅ Admin credentials updated!');
        console.log('   Username: admin');
        console.log('   Password: BoneBuddy@96PhysioX&');
      }
    }
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.\n');
    process.exit(0);
  }
}

verifyAdmin();


import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './src/models/user.models.js';
import connectDB from './src/db/index.js';

dotenv.config();

async function setupAdmin() {
  try {
    console.log('🔌 Connecting to database...');
    await connectDB();
    console.log('✅ Connected!\n');

    const username = 'admin';
    const password = 'BoneBuddy@96PhysioX&';

    console.log('🔍 Looking for admin user...');
    
    // Find admin by username first
    let admin = await User.findOne({ username: username });
    
    if (!admin) {
      // Try to find any admin user
      admin = await User.findOne({ userType: 'admin' });
    }

    if (admin) {
      console.log(`📝 Found admin user: ${admin._id}`);
      console.log('   Updating credentials...\n');
      
      admin.username = username;
      admin.password = password;
      admin.userType = 'admin';
      if (!admin.Fullname) admin.Fullname = 'Admin';
      if (!admin.email) admin.email = 'admin@bonebuddy.cloud';
      if (!admin.mobile_number) admin.mobile_number = '9999999999';
      
      await admin.save();
      console.log('✅ SUCCESS: Admin credentials updated!');
    } else {
      console.log('📝 Creating new admin user...\n');
      admin = await User.create({
        username: username,
        password: password,
        userType: 'admin',
        Fullname: 'Admin',
        email: 'admin@bonebuddy.cloud',
        mobile_number: '9999999999',
        gender: 'Other',
        dateOfBirth: new Date('1990-01-01'),
        age: 34,
        address: 'Unknown'
      });
      console.log('✅ SUCCESS: Admin user created!');
    }
    
    console.log('\n📋 Login Credentials:');
    console.log('   Username: admin');
    console.log('   Password: BoneBuddy@96PhysioX&');
    console.log('\n✅ Setup complete!\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.code === 11000) {
      console.log('⚠️  User already exists. Attempting to update...');
      try {
        const existing = await User.findOne({ 
          $or: [
            { username: 'admin' },
            { mobile_number: '9999999999' }
          ]
        });
        if (existing) {
          existing.username = 'admin';
          existing.password = 'BoneBuddy@96PhysioX&';
          existing.userType = 'admin';
          await existing.save();
          console.log('✅ Updated existing user!');
        }
      } catch (e) {
        console.error('❌ Update failed:', e.message);
      }
    }
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed.');
    }
    process.exit(0);
  }
}

setupAdmin();


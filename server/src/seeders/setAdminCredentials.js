import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from '../models/user.models.js';
import connectDB from '../db/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function setAdminCredentials() {
  try {
    console.log('Starting admin credentials setup...');
    await connectDB();
    console.log('✅ Connected to DB');

    const username = 'admin';
    const password = 'BoneBuddy@96PhysioX&';

    // First, try to find by username
    let adminUser = await User.findOne({ username: username });
    
    // If not found by username, try to find any admin without username
    if (!adminUser) {
      adminUser = await User.findOne({ 
        userType: 'admin',
        $or: [
          { username: { $exists: false } },
          { username: '' },
          { username: null }
        ]
      });
    }

    if (adminUser) {
      // Update existing admin
      console.log(`\n📝 Found existing admin user: ${adminUser.username || adminUser._id}`);
      adminUser.username = username;
      adminUser.userType = 'admin';
      
      // Set default values if missing
      if (!adminUser.Fullname) adminUser.Fullname = 'Admin';
      if (!adminUser.email) adminUser.email = 'info@bonebuddy.org';
      if (!adminUser.mobile_number) adminUser.mobile_number = '9999999999';
      
      // Update password - mark as modified to trigger pre-save hook
      adminUser.password = password;
      adminUser.markModified('password');
      
      await adminUser.save({ validateBeforeSave: false });
      console.log(`\n✅ Admin credentials updated successfully!`);
      console.log(`   Username: ${username}`);
      console.log(`   Password: ${password}\n`);
    } else {
      // Create new admin user
      console.log('\n📝 Creating new admin user...');
      adminUser = await User.create({
        username: username,
        password: password, // Will be hashed by pre-save hook
        userType: 'admin',
        Fullname: 'Admin',
        email: 'info@bonebuddy.org',
        mobile_number: '9999999999',
        gender: 'Other',
        dateOfBirth: new Date('1990-01-01'),
        age: 34,
        address: 'Unknown'
      });
      console.log(`\n✅ Admin user created successfully!`);
      console.log(`   Username: ${username}`);
      console.log(`   Password: ${password}\n`);
    }

  } catch (error) {
    console.error('\n❌ Error setting admin credentials:');
    console.error('   Message:', error.message);
    if (error.code === 11000) {
      console.error('   Duplicate key error - user might already exist');
    }
    console.error('   Full error:', error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('Database connection closed.');
    }
    process.exit(0);
  }
}

setAdminCredentials();


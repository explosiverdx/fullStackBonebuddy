import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from '../models/user.models.js';
import connectDB from '../db/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function createAdmin() {
  try {
    process.stdout.write('Connecting to database...\n');
    await connectDB();
    process.stdout.write('Connected!\n\n');

    const username = 'admin';
    const password = 'BoneBuddy@96PhysioX&';

    // Try to find existing admin
    let admin = await User.findOne({ username: username });
    
    if (admin) {
      process.stdout.write(`Updating existing admin: ${admin._id}\n`);
      admin.password = password;
      admin.userType = 'admin';
      if (!admin.Fullname) admin.Fullname = 'Admin';
      if (!admin.email) admin.email = 'admin@bonebuddy.com';
      if (!admin.mobile_number) admin.mobile_number = '9999999999';
      await admin.save();
      process.stdout.write('SUCCESS: Admin credentials updated!\n');
    } else {
      // Check if any admin exists without username
      admin = await User.findOne({ userType: 'admin' });
      if (admin) {
        process.stdout.write(`Updating existing admin: ${admin._id}\n`);
        admin.username = username;
        admin.password = password;
        await admin.save();
        process.stdout.write('SUCCESS: Admin credentials updated!\n');
      } else {
        // Create new admin
        admin = await User.create({
          username: username,
          password: password,
          userType: 'admin',
          Fullname: 'Admin',
          email: 'admin@bonebuddy.com',
          mobile_number: '9999999999',
          gender: 'Other',
          dateOfBirth: new Date('1990-01-01'),
          age: 34,
          address: 'Unknown'
        });
        process.stdout.write('SUCCESS: Admin user created!\n');
      }
    }
    
    process.stdout.write(`\nUsername: ${username}\n`);
    process.stdout.write(`Password: ${password}\n\n`);

  } catch (error) {
    process.stderr.write(`ERROR: ${error.message}\n`);
    if (error.code === 11000) {
      process.stderr.write('Duplicate key - trying to update existing user...\n');
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
          process.stdout.write('SUCCESS: Updated existing user!\n');
        }
      } catch (e) {
        process.stderr.write(`ERROR: ${e.message}\n`);
      }
    }
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(0);
  }
}

createAdmin();


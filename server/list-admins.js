import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './src/models/user.models.js';
import connectDB from './src/db/index.js';

dotenv.config();

async function listAdmins() {
  try {
    process.stdout.write('Connecting to database...\n');
    await connectDB();
    process.stdout.write('Connected!\n\n');

    process.stdout.write('Fetching all admin users...\n\n');
    
    const admins = await User.find({ userType: 'admin' })
      .select('username email mobile_number Fullname userType createdAt password')
      .sort({ createdAt: -1 });

    if (admins.length === 0) {
      process.stdout.write('No admin users found.\n');
    } else {
      process.stdout.write(`Found ${admins.length} admin user(s):\n\n`);
      process.stdout.write('='.repeat(80) + '\n');
      
      admins.forEach((admin, index) => {
        process.stdout.write(`\nAdmin #${index + 1}:\n`);
        process.stdout.write(`  ID: ${admin._id}\n`);
        process.stdout.write(`  Username: ${admin.username || '(not set)'}\n`);
        process.stdout.write(`  Full Name: ${admin.Fullname || '(not set)'}\n`);
        process.stdout.write(`  Email: ${admin.email || '(not set)'}\n`);
        process.stdout.write(`  Mobile: ${admin.mobile_number || '(not set)'}\n`);
        process.stdout.write(`  User Type: ${admin.userType}\n`);
        process.stdout.write(`  Created: ${admin.createdAt ? new Date(admin.createdAt).toLocaleString() : '(unknown)'}\n`);
        process.stdout.write(`  Has Password: ${admin.password ? 'Yes' : 'No'}\n`);
      });
      
      process.stdout.write('\n' + '='.repeat(80) + '\n');
      process.stdout.write(`\nTotal: ${admins.length} admin user(s)\n\n`);
    }

  } catch (error) {
    process.stderr.write(`ERROR: ${error.message}\n`);
    process.stderr.write(`Full error: ${error}\n`);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      process.stdout.write('Database connection closed.\n');
    }
    process.exit(0);
  }
}

listAdmins();


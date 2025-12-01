import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from '../models/user.models.js';
import connectDB from '../db/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function listAdmins() {
  try {
    console.log('🔌 Connecting to database...\n');
    await connectDB();
    console.log('✅ Connected!\n');

    console.log('🔍 Fetching all admin users...\n');
    
    const admins = await User.find({ userType: 'admin' })
      .select('username email mobile_number Fullname userType createdAt')
      .sort({ createdAt: -1 });

    if (admins.length === 0) {
      console.log('❌ No admin users found in the database.\n');
    } else {
      console.log(`✅ Found ${admins.length} admin user(s):\n`);
      console.log('='.repeat(80));
      
      admins.forEach((admin, index) => {
        console.log(`\n📋 Admin #${index + 1}:`);
        console.log(`   ID: ${admin._id}`);
        console.log(`   Username: ${admin.username || '(not set)'}`);
        console.log(`   Full Name: ${admin.Fullname || '(not set)'}`);
        console.log(`   Email: ${admin.email || '(not set)'}`);
        console.log(`   Mobile: ${admin.mobile_number || '(not set)'}`);
        console.log(`   User Type: ${admin.userType}`);
        console.log(`   Created: ${admin.createdAt ? new Date(admin.createdAt).toLocaleString() : '(unknown)'}`);
        console.log(`   Has Password: ${admin.password ? 'Yes ✅' : 'No ❌'}`);
      });
      
      console.log('\n' + '='.repeat(80));
      console.log(`\n📊 Total: ${admins.length} admin user(s)\n`);
    }

  } catch (error) {
    console.error('\n❌ Error fetching admins:');
    console.error('   Message:', error.message);
    console.error('   Full error:', error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed.\n');
    }
    process.exit(0);
  }
}

listAdmins();


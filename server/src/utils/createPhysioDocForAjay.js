/**
 * Create Physio Document for Ajay Kumar
 * 
 * This creates the missing Physio document for existing physiotherapist users
 * Run with: node --experimental-json-modules src/utils/createPhysioDocForAjay.js
 */

import mongoose from 'mongoose';
import { User } from '../models/user.models.js';
import { Physio } from '../models/physio.models.js';
import dotenv from 'dotenv';

dotenv.config();

async function createPhysioDocForAjay() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database\n');

        // Find all users with userType 'physiotherapist' (note the full word)
        const physioUsers = await User.find({ 
            userType: { $in: ['physio', 'physiotherapist'] }
        });

        console.log('='.repeat(70));
        console.log('🔧 CREATING PHYSIO DOCUMENTS');
        console.log('='.repeat(70));
        console.log(`\nFound ${physioUsers.length} physiotherapist user(s)\n`);

        if (physioUsers.length === 0) {
            console.log('❌ No physiotherapists found!');
            await mongoose.disconnect();
            return;
        }

        let created = 0;
        let skipped = 0;

        for (const user of physioUsers) {
            console.log(`\nProcessing: ${user.Fullname || user.username}`);
            console.log(`   User ID: ${user._id}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Phone: ${user.mobile_number}`);
            console.log(`   UserType: "${user.userType}"`);

            // Check if Physio document already exists
            const existingPhysio = await Physio.findOne({ userId: user._id });

            if (existingPhysio) {
                console.log('   ✅ Physio document already exists (ID: ' + existingPhysio._id + ')');
                skipped++;
                continue;
            }

            // Create Physio document using data from User document
            try {
                const newPhysio = await Physio.create({
                    userId: user._id,
                    name: user.Fullname || user.username || 'Unnamed',
                    specialization: user.specialization || 'General Physiotherapy',
                    qualification: user.qualification || 'BPT',
                    experience: user.experience ? `${user.experience} years` : '1 year',
                    availableDays: user.availableDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                    availableTimeSlots: user.availableTimeSlots ? [user.availableTimeSlots] : ['9:00 AM - 5:00 PM'],
                    consultationFee: user.consultationFee || 500,
                    bio: user.bio || 'Experienced physiotherapist',
                    assignedDoctor: null,
                    patientsAssigned: []
                });

                console.log('   ✅ CREATED Physio document!');
                console.log(`      Physio ID: ${newPhysio._id}`);
                console.log(`      Name: ${newPhysio.name}`);
                console.log(`      Specialization: ${newPhysio.specialization}`);
                console.log(`      Experience: ${newPhysio.experience}`);
                created++;
            } catch (error) {
                console.log('   ❌ Failed to create Physio document');
                console.log(`      Error: ${error.message}`);
            }
        }

        console.log('\n' + '='.repeat(70));
        console.log('📊 SUMMARY');
        console.log('='.repeat(70));
        console.log(`\nTotal physiotherapist users: ${physioUsers.length}`);
        console.log(`✅ Created new Physio docs: ${created}`);
        console.log(`⏭️  Skipped (already existed): ${skipped}`);

        if (created > 0) {
            console.log('\n🎉 SUCCESS!');
            console.log('\n💡 Next steps:');
            console.log('   1. Restart your backend server');
            console.log('   2. Clear browser cache (Ctrl+Shift+Delete)');
            console.log('   3. Refresh admin dashboard (Ctrl+F5)');
            console.log('   4. Go to Allocate Session');
            console.log('   5. Try searching for "Ajay" or "Kumar"');
            console.log('   6. Should work now! ✅');
        }

        console.log('\n' + '='.repeat(70));

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from database');
        
    } catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
    }
}

createPhysioDocForAjay();


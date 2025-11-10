/**
 * Fix Physiotherapist Profiles
 * 
 * This script creates missing Physio documents for users with userType='physio'
 * Run with: node --experimental-json-modules src/utils/fixPhysioProfiles.js
 */

import mongoose from 'mongoose';
import { User } from '../models/user.models.js';
import { Physio } from '../models/physio.models.js';
import dotenv from 'dotenv';

dotenv.config();

async function fixPhysioProfiles() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database\n');

        // Find all physio users
        const physioUsers = await User.find({ userType: 'physio' });
        
        console.log('='.repeat(70));
        console.log('🔧 FIXING PHYSIOTHERAPIST PROFILES');
        console.log('='.repeat(70));
        console.log(`\nFound ${physioUsers.length} physio user(s)\n`);

        if (physioUsers.length === 0) {
            console.log('❌ No physiotherapists found in database!');
            await mongoose.disconnect();
            return;
        }

        let fixed = 0;
        let skipped = 0;
        let errors = 0;

        for (const user of physioUsers) {
            console.log(`\nProcessing: ${user.Fullname || user.username || user._id}`);
            console.log(`   User ID: ${user._id}`);

            // Check if Physio document already exists
            const existingPhysio = await Physio.findOne({ userId: user._id });

            if (existingPhysio) {
                console.log('   ✅ Physio document already exists (ID: ' + existingPhysio._id + ')');
                skipped++;
                continue;
            }

            // Create missing Physio document
            try {
                const newPhysio = await Physio.create({
                    userId: user._id,
                    name: user.Fullname || user.username || 'Unnamed Physio',
                    specialization: user.specialization || 'General Physiotherapy',
                    qualification: user.qualification || 'BPT',
                    experience: user.experience || '1 year',
                    availableDays: user.availableDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                    availableTimeSlots: user.availableTimeSlots || ['9:00 AM - 5:00 PM'],
                    consultationFee: user.consultationFee || 500,
                    bio: user.bio || 'Experienced physiotherapist',
                    assignedDoctor: null,
                    patientsAssigned: []
                });

                console.log('   ✅ Created Physio document (ID: ' + newPhysio._id + ')');
                console.log(`      Name: ${newPhysio.name}`);
                console.log(`      Specialization: ${newPhysio.specialization}`);
                fixed++;
            } catch (error) {
                console.log('   ❌ Failed to create Physio document');
                console.log(`      Error: ${error.message}`);
                errors++;
            }
        }

        // Summary
        console.log('\n' + '='.repeat(70));
        console.log('📊 SUMMARY');
        console.log('='.repeat(70));
        console.log(`\nTotal physio users: ${physioUsers.length}`);
        console.log(`✅ Fixed (created new Physio docs): ${fixed}`);
        console.log(`⏭️  Skipped (already had Physio docs): ${skipped}`);
        console.log(`❌ Errors: ${errors}`);

        if (fixed > 0) {
            console.log('\n🎉 SUCCESS! Physiotherapist profiles have been fixed.');
            console.log('\n💡 Next steps:');
            console.log('   1. Go to Admin Dashboard → Allocate Session');
            console.log('   2. Try searching for your physiotherapists');
            console.log('   3. They should now appear in search results!');
            console.log('\n📝 Search tips:');
            console.log('   - Type at least 2 characters');
            console.log('   - Search by name, username, email, or phone');
            console.log('   - Clear browser cache if needed (Ctrl+Shift+Delete)');
        } else if (skipped === physioUsers.length) {
            console.log('\n✅ All physiotherapists already have profiles!');
            console.log('\n🔍 If search still not working, possible causes:');
            console.log('   1. Search term too short (need 2+ characters)');
            console.log('   2. Empty/null names - check User.Fullname field');
            console.log('   3. Browser cache - try Ctrl+Shift+Delete');
            console.log('   4. Wrong search term - doesn\'t match any names');
            console.log('\n💡 Run debug script for more details:');
            console.log('   node --experimental-json-modules src/utils/debugPhysioData.js');
        }

        console.log('\n' + '='.repeat(70));

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from database');
        
    } catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
    }
}

fixPhysioProfiles();


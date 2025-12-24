/**
 * Find Missing Physiotherapists
 * 
 * This script searches for physiotherapists regardless of userType field value
 * Run with: node --experimental-json-modules src/utils/findMissingPhysios.js
 */

import mongoose from 'mongoose';
import { User } from '../models/user.models.js';
import { Physio } from '../models/physio.models.js';
import dotenv from 'dotenv';

dotenv.config();

async function findMissingPhysios() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database\n');

        console.log('='.repeat(70));
        console.log('🔍 SEARCHING FOR ALL PHYSIOTHERAPISTS');
        console.log('='.repeat(70));

        // First, let's see what userTypes exist
        const userTypes = await User.distinct('userType');
        console.log('\n📊 UserTypes found in database:');
        userTypes.forEach(type => console.log(`   - "${type}"`));

        // Search with multiple possible userType values
        const possibleTypes = ['physio', 'physiotherapist', 'Physio', 'Physiotherapist', 'PHYSIO'];
        
        console.log('\n🔍 Searching for users with physio-related userTypes...\n');

        let allPhysioUsers = [];

        for (const type of possibleTypes) {
            const users = await User.find({ userType: type }).lean();
            if (users.length > 0) {
                console.log(`Found ${users.length} user(s) with userType="${type}"`);
                allPhysioUsers = [...allPhysioUsers, ...users];
            }
        }

        // Also search by qualification or specialization fields that might indicate physio
        const physioByFields = await User.find({
            $or: [
                { specialization: { $regex: 'physio', $options: 'i' } },
                { qualification: { $regex: 'physio|bpt|mpt', $options: 'i' } },
                { bio: { $regex: 'physio', $options: 'i' } }
            ]
        }).lean();

        if (physioByFields.length > 0) {
            console.log(`\n Found ${physioByFields.length} additional user(s) by qualification/specialization`);
            // Merge without duplicates
            physioByFields.forEach(user => {
                if (!allPhysioUsers.find(u => u._id.toString() === user._id.toString())) {
                    allPhysioUsers.push(user);
                }
            });
        }

        // Search by email pattern (physio-related emails)
        const physioByEmail = await User.find({
            email: { $regex: 'physio', $options: 'i' }
        }).lean();

        if (physioByEmail.length > 0) {
            console.log(`Found ${physioByEmail.length} user(s) with physio-related email`);
            physioByEmail.forEach(user => {
                if (!allPhysioUsers.find(u => u._id.toString() === user._id.toString())) {
                    allPhysioUsers.push(user);
                }
            });
        }

        // Let's also just list ALL users to see what's there
        console.log('\n' + '='.repeat(70));
        console.log('📋 ALL USERS IN DATABASE:');
        console.log('='.repeat(70));

        const allUsers = await User.find({}).select('_id Fullname username email mobile_number userType qualification specialization').lean();
        
        console.log(`\nTotal users: ${allUsers.length}\n`);

        allUsers.forEach((user, idx) => {
            console.log(`${idx + 1}. ${user.Fullname || user.username || 'Unnamed'}`);
            console.log(`   ID: ${user._id}`);
            console.log(`   Email: ${user.email || 'N/A'}`);
            console.log(`   Phone: ${user.mobile_number || 'N/A'}`);
            console.log(`   UserType: "${user.userType || 'N/A'}"`);
            console.log(`   Qualification: ${user.qualification || 'N/A'}`);
            console.log(`   Specialization: ${user.specialization || 'N/A'}`);
            
            // Check if has Physio document
            const physioDocExists = false; // We'll check this
            console.log('');
        });

        // Now let's check Physio collection
        console.log('='.repeat(70));
        console.log('📋 PHYSIO COLLECTION:');
        console.log('='.repeat(70));

        const allPhysioDocs = await Physio.find({}).lean();
        console.log(`\nTotal Physio documents: ${allPhysioDocs.length}\n`);

        if (allPhysioDocs.length > 0) {
            for (const physio of allPhysioDocs) {
                const user = await User.findById(physio.userId);
                console.log(`- ${physio.name}`);
                console.log(`  Physio ID: ${physio._id}`);
                console.log(`  User ID: ${physio.userId}`);
                console.log(`  User exists: ${user ? '✅' : '❌'}`);
                if (user) {
                    console.log(`  User type: ${user.userType}`);
                }
                console.log('');
            }
        }

        // Look for Ajay Kumar specifically
        console.log('='.repeat(70));
        console.log('🔍 SEARCHING FOR "AJAY KUMAR":');
        console.log('='.repeat(70));

        const ajay = await User.findOne({
            $or: [
                { Fullname: { $regex: 'ajay', $options: 'i' } },
                { username: { $regex: 'ajay', $options: 'i' } },
                { email: { $regex: 'ajay', $options: 'i' } },
                { mobile_number: { $regex: '7860969790' } }
            ]
        });

        if (ajay) {
            console.log('\n✅ FOUND AJAY KUMAR!');
            console.log(`   User ID: ${ajay._id}`);
            console.log(`   Full Name: ${ajay.Fullname}`);
            console.log(`   Email: ${ajay.email}`);
            console.log(`   Phone: ${ajay.mobile_number}`);
            console.log(`   UserType: "${ajay.userType}"`);
            console.log(`   Qualification: ${ajay.qualification || 'N/A'}`);
            console.log(`   Specialization: ${ajay.specialization || 'N/A'}`);
            console.log(`   Experience: ${ajay.experience || 'N/A'}`);

            // Check if has Physio document
            const ajayPhysio = await Physio.findOne({ userId: ajay._id });
            console.log(`   Has Physio Document: ${ajayPhysio ? '✅' : '❌'}`);

            if (!ajayPhysio) {
                console.log('\n❌ PROBLEM IDENTIFIED:');
                console.log('   Ajay Kumar has User account but NO Physio document!');
                console.log('\n💡 SOLUTION:');
                console.log('   1. Fix userType to "physio"');
                console.log('   2. Create Physio document');
                console.log('\n   Run: node --experimental-json-modules src/utils/fixAjayKumar.js');
            }

            if (ajay.userType !== 'physio') {
                console.log(`\n⚠️  UserType is "${ajay.userType}" but should be "physio"`);
                console.log('   This is why the search scripts couldn\'t find him!');
            }
        } else {
            console.log('\n❌ Could not find Ajay Kumar in database!');
            console.log('   Phone searched: +917860969790');
            console.log('   Email searched: ajaykumar.bonebuddy@gmail.com');
        }

        console.log('\n' + '='.repeat(70));
        console.log('📋 RECOMMENDATIONS:');
        console.log('='.repeat(70));

        if (ajay && ajay.userType !== 'physio') {
            console.log('\n1. Update Ajay\'s userType to "physio"');
            console.log('2. Create Physio document for Ajay');
            console.log('3. Then search will work!');
            console.log('\n💡 I can create a fix script for you.');
        } else if (ajay && !await Physio.findOne({ userId: ajay._id })) {
            console.log('\n1. Create Physio document for Ajay');
            console.log('2. Then search will work!');
        } else if (!ajay) {
            console.log('\n❌ Ajay Kumar not found in database at all!');
            console.log('   Please verify:');
            console.log('   - Was he actually created?');
            console.log('   - Check the correct database is connected');
            console.log('   - Try registering him again');
        }

        console.log('\n' + '='.repeat(70));

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from database');
        
    } catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
    }
}

findMissingPhysios();


/**
 * Create Test Physiotherapist
 * 
 * This script creates a test physiotherapist to verify the search functionality works.
 * Run with: node --experimental-json-modules src/utils/createTestPhysio.js
 */

import mongoose from 'mongoose';
import { User } from '../models/user.models.js';
import { Physio } from '../models/physio.models.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function createTestPhysio() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database\n');

        // Check if test physio already exists
        const existingUser = await User.findOne({ email: 'jane.smith@test.com' });
        if (existingUser) {
            console.log('ℹ️  Test physiotherapist already exists!');
            console.log('Name: Jane Smith');
            console.log('Email: jane.smith@test.com');
            console.log('\n💡 Try searching for: "jane" or "smith"');
            await mongoose.disconnect();
            return;
        }

        console.log('Creating test physiotherapist...\n');

        // Create user account
        const user = await User.create({
            Fullname: 'Jane Smith',
            username: 'jane_physio',
            email: 'jane.smith@test.com',
            mobile_number: '+919876543210',
            password: 'Test@123',
            userType: 'physio',
            gender: 'Female',
            dateOfBirth: new Date('1990-05-15'),
            age: 34,
            address: 'Mumbai, Maharashtra',
            profileCompleted: true
        });

        console.log('✅ User account created');
        console.log(`   User ID: ${user._id}`);
        console.log(`   Name: ${user.Fullname}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Phone: ${user.mobile_number}\n`);

        // Create physio profile
        const physio = await Physio.create({
            userId: user._id,
            name: 'Jane Smith',
            specialization: 'Orthopedic Physiotherapy',
            qualification: 'MPT in Orthopedics',
            experience: '5 years',
            availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            availableTimeSlots: ['9:00 AM - 12:00 PM', '2:00 PM - 6:00 PM'],
            consultationFee: 1000,
            bio: 'Experienced physiotherapist specializing in post-surgery rehabilitation',
            assignedDoctor: null,
            patientsAssigned: []
        });

        console.log('✅ Physio profile created');
        console.log(`   Physio ID: ${physio._id}`);
        console.log(`   Specialization: ${physio.specialization}`);
        console.log(`   Experience: ${physio.experience}\n`);

        console.log('='.repeat(60));
        console.log('🎉 TEST PHYSIOTHERAPIST CREATED SUCCESSFULLY!');
        console.log('='.repeat(60));
        console.log('\n📋 Login Credentials:');
        console.log('   Email: jane.smith@test.com');
        console.log('   Password: Test@123');
        console.log('   Phone: +919876543210\n');
        console.log('💡 Test the Search:');
        console.log('   1. Go to Admin Dashboard → Allocate Session');
        console.log('   2. In Physiotherapist field, type: "jane"');
        console.log('   3. Dropdown should show "Jane Smith"');
        console.log('   4. Select and allocate session!\n');
        console.log('🔍 Other search terms that work:');
        console.log('   - "jane"');
        console.log('   - "smith"');
        console.log('   - "orthopedic"');
        console.log('   - "9876"\n');

        // Test the search pipeline
        console.log('🧪 Testing search pipeline...\n');
        
        const searchResults = await User.aggregate([
            { $match: { userType: 'physio' } },
            {
                $lookup: {
                    from: 'physios',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'physio'
                }
            },
            {
                $unwind: {
                    path: '$physio',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $match: {
                    $or: [
                        { 'physio.name': { $regex: 'jane', $options: 'i' } },
                        { Fullname: { $regex: 'jane', $options: 'i' } }
                    ]
                }
            },
            {
                $project: {
                    _id: { $ifNull: ['$physio._id', '$_id'] },
                    name: { $ifNull: ['$physio.name', '$Fullname'] },
                    contact: '$mobile_number',
                    shortId: { $substr: [{ $toString: '$_id' }, 18, 6] }
                }
            }
        ]);

        if (searchResults.length > 0) {
            console.log('✅ Search pipeline working! Found:');
            searchResults.forEach(result => {
                console.log(`   - ${result.name} (ID: ${result._id})`);
            });
        } else {
            console.log('⚠️  Search pipeline returned no results (might be a timing issue)');
        }

        // Disconnect
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from database');
        
    } catch (error) {
        console.error('\n❌ Error:', error);
        console.error('\nPossible causes:');
        console.error('1. MongoDB not running');
        console.error('2. Wrong connection string in .env');
        console.error('3. Missing dependencies (run: npm install)');
        process.exit(1);
    }
}

// Run the script
createTestPhysio();


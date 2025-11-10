/**
 * Debug Physiotherapist Data
 * 
 * This script analyzes your existing physiotherapist data to find why search isn't working
 * Run with: node --experimental-json-modules src/utils/debugPhysioData.js
 */

import mongoose from 'mongoose';
import { User } from '../models/user.models.js';
import { Physio } from '../models/physio.models.js';
import dotenv from 'dotenv';

dotenv.config();

async function debugPhysioData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database\n');

        // Find all physio users
        const physioUsers = await User.find({ userType: 'physio' }).lean();
        
        console.log('='.repeat(70));
        console.log('📊 PHYSIOTHERAPIST DATA ANALYSIS');
        console.log('='.repeat(70));
        console.log(`\nTotal physio users found: ${physioUsers.length}\n`);

        if (physioUsers.length === 0) {
            console.log('❌ No physiotherapists found in database!');
            console.log('You need to create physiotherapists first.');
            await mongoose.disconnect();
            return;
        }

        // Analyze each physio
        for (const [index, user] of physioUsers.entries()) {
            console.log(`\n${'-'.repeat(70)}`);
            console.log(`Physio #${index + 1}:`);
            console.log(`${'-'.repeat(70)}`);
            
            // Check User document fields
            console.log('\n📄 User Document:');
            console.log(`   ID: ${user._id}`);
            console.log(`   Fullname: ${user.Fullname || '❌ MISSING'}`);
            console.log(`   Username: ${user.username || '❌ MISSING'}`);
            console.log(`   Email: ${user.email || '❌ MISSING'}`);
            console.log(`   Mobile: ${user.mobile_number || '❌ MISSING'}`);
            console.log(`   UserType: ${user.userType}`);

            // Check if corresponding Physio document exists
            const physioDoc = await Physio.findOne({ userId: user._id }).lean();
            
            if (physioDoc) {
                console.log('\n📋 Physio Document: ✅ EXISTS');
                console.log(`   Physio ID: ${physioDoc._id}`);
                console.log(`   Name: ${physioDoc.name || '❌ MISSING'}`);
                console.log(`   Specialization: ${physioDoc.specialization || '❌ MISSING'}`);
                console.log(`   Qualification: ${physioDoc.qualification || '❌ MISSING'}`);
                console.log(`   Experience: ${physioDoc.experience || '❌ MISSING'}`);
            } else {
                console.log('\n📋 Physio Document: ❌ MISSING');
                console.log('   ⚠️  This is the problem! User exists but Physio profile missing.');
            }

            // Test if this physio would be found by search
            console.log('\n🔍 Search Test Results:');
            
            const searchFields = {
                'By Fullname': user.Fullname,
                'By Physio.name': physioDoc?.name,
                'By Username': user.username,
                'By Email': user.email,
                'By Mobile': user.mobile_number,
                'By Specialization': physioDoc?.specialization
            };

            for (const [field, value] of Object.entries(searchFields)) {
                if (value) {
                    console.log(`   ${field}: "${value}" ✅`);
                } else {
                    console.log(`   ${field}: ❌ NULL/MISSING`);
                }
            }

            // Show what search terms would work
            console.log('\n💡 Suggested search terms for this physio:');
            const suggestions = [];
            if (user.Fullname) suggestions.push(`"${user.Fullname.toLowerCase().substring(0, 4)}"`);
            if (physioDoc?.name) suggestions.push(`"${physioDoc.name.toLowerCase().substring(0, 4)}"`);
            if (user.username) suggestions.push(`"${user.username.toLowerCase().substring(0, 4)}"`);
            if (user.email) suggestions.push(`"${user.email.split('@')[0]}"`);
            
            if (suggestions.length > 0) {
                console.log(`   ${suggestions.join(', ')}`);
            } else {
                console.log('   ⚠️  No searchable fields found!');
            }
        }

        // Test the actual search pipeline
        console.log('\n' + '='.repeat(70));
        console.log('🧪 TESTING ACTUAL SEARCH PIPELINE');
        console.log('='.repeat(70));

        // Test with a common search term
        const testSearchTerm = 'a'; // Single char to catch most names
        
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
                        { 'physio.name': { $regex: testSearchTerm, $options: 'i' } },
                        { Fullname: { $regex: testSearchTerm, $options: 'i' } },
                        { username: { $regex: testSearchTerm, $options: 'i' } },
                        { email: { $regex: testSearchTerm, $options: 'i' } },
                        { mobile_number: { $regex: testSearchTerm, $options: 'i' } }
                    ]
                }
            },
            {
                $project: {
                    _id: { $ifNull: ['$physio._id', '$_id'] },
                    userId: '$_id',
                    name: { $ifNull: ['$physio.name', '$Fullname'] },
                    contact: '$mobile_number',
                    hasPhysioDoc: { $cond: [{ $ifNull: ['$physio._id', false] }, true, false] }
                }
            }
        ]);

        console.log(`\nSearch test with term "${testSearchTerm}":`);
        console.log(`Found ${searchResults.length} results\n`);

        searchResults.forEach((result, idx) => {
            console.log(`${idx + 1}. ${result.name}`);
            console.log(`   ID: ${result._id}`);
            console.log(`   Has Physio Doc: ${result.hasPhysioDoc ? '✅' : '❌'}`);
            console.log(`   Contact: ${result.contact || 'N/A'}\n`);
        });

        // Summary and recommendations
        console.log('='.repeat(70));
        console.log('📋 SUMMARY & RECOMMENDATIONS');
        console.log('='.repeat(70));

        const usersWithoutPhysioDoc = physioUsers.filter(async (user) => {
            const doc = await Physio.findOne({ userId: user._id });
            return !doc;
        });

        console.log('\n🔍 Issues Found:');
        
        let issuesFound = false;

        // Check for users without Physio documents
        const missingDocs = [];
        for (const user of physioUsers) {
            const doc = await Physio.findOne({ userId: user._id });
            if (!doc) {
                missingDocs.push(user);
            }
        }

        if (missingDocs.length > 0) {
            issuesFound = true;
            console.log(`\n❌ ${missingDocs.length} physio user(s) WITHOUT Physio document:`);
            missingDocs.forEach(user => {
                console.log(`   - ${user.Fullname || user.username} (ID: ${user._id})`);
            });
            console.log('\n   💡 Solution: Create Physio documents for these users');
            console.log('   Run: node --experimental-json-modules src/utils/fixPhysioProfiles.js');
        }

        // Check for users with empty/null names
        const emptyNames = physioUsers.filter(u => !u.Fullname || u.Fullname.trim() === '');
        if (emptyNames.length > 0) {
            issuesFound = true;
            console.log(`\n❌ ${emptyNames.length} physio user(s) with EMPTY Fullname:`);
            emptyNames.forEach(user => {
                console.log(`   - User ID: ${user._id} (Username: ${user.username})`);
            });
            console.log('\n   💡 Solution: Update Fullname field for these users');
        }

        if (!issuesFound) {
            console.log('\n✅ No major issues found!');
            console.log('\n   Possible causes:');
            console.log('   1. Search term too short (need 2+ characters)');
            console.log('   2. Search term doesn\'t match any physio names');
            console.log('   3. Browser cache (try Ctrl+Shift+Delete)');
        }

        console.log('\n' + '='.repeat(70));

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from database');
        
    } catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
    }
}

debugPhysioData();


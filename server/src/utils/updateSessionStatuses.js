/**
 * Update Session Statuses
 * 
 * This script updates old sessions with status 'ongoing' to 'scheduled'
 * for consistency with the new session management system.
 * 
 * Run with: node --experimental-json-modules src/utils/updateSessionStatuses.js
 */

import mongoose from 'mongoose';
import { Session } from '../models/sessions.models.js';
import dotenv from 'dotenv';

dotenv.config();

async function updateSessionStatuses() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database\n');

        console.log('='.repeat(70));
        console.log('🔄 UPDATING SESSION STATUSES');
        console.log('='.repeat(70));

        // Find all sessions with 'ongoing' status
        const ongoingSessions = await Session.find({ status: 'ongoing' });
        
        console.log(`\nFound ${ongoingSessions.length} sessions with status 'ongoing'\n`);

        if (ongoingSessions.length === 0) {
            console.log('✅ No sessions need updating. All statuses are already correct!');
            await mongoose.disconnect();
            return;
        }

        let updated = 0;
        let errors = 0;

        for (const session of ongoingSessions) {
            try {
                const sessionDate = new Date(session.sessionDate);
                const now = new Date();

                // Determine correct status based on session date
                let newStatus;
                
                if (session.startTime && session.endTime) {
                    // Has both start and end times - was completed
                    newStatus = 'completed';
                } else if (session.startTime && !session.endTime) {
                    // Has start time but no end time - was in progress
                    newStatus = 'in-progress';
                } else if (sessionDate > now) {
                    // Future session - scheduled
                    newStatus = 'scheduled';
                } else {
                    // Past session without start time - check if it should be marked as missed
                    const sessionEnd = new Date(sessionDate.getTime() + (session.durationMinutes || 60) * 60000);
                    // If session time has passed and physiotherapist didn't start it, mark as missed
                    if (now > sessionEnd && !session.startTime) {
                        newStatus = 'missed';
                    } else {
                        // Past session without start time (legacy handling)
                        newStatus = 'completed';
                    }
                }

                // Update session
                session.status = newStatus;
                await session.save();

                console.log(`✅ Updated session ${session._id.toString().substring(0, 8)}...`);
                console.log(`   Patient: ${session.patientId || 'N/A'}`);
                console.log(`   Date: ${sessionDate.toLocaleString()}`);
                console.log(`   Old Status: ongoing → New Status: ${newStatus}`);
                console.log('');

                updated++;
            } catch (error) {
                console.log(`❌ Failed to update session ${session._id}`);
                console.log(`   Error: ${error.message}\n`);
                errors++;
            }
        }

        console.log('='.repeat(70));
        console.log('📊 SUMMARY');
        console.log('='.repeat(70));
        console.log(`\nTotal sessions found: ${ongoingSessions.length}`);
        console.log(`✅ Successfully updated: ${updated}`);
        console.log(`❌ Errors: ${errors}`);

        if (updated > 0) {
            console.log('\n🎉 Status update complete!');
            console.log('\n💡 What changed:');
            console.log('   - Old "ongoing" status → New statuses based on actual state');
            console.log('   - Future sessions → "scheduled"');
            console.log('   - In-progress sessions → "in-progress"');
            console.log('   - Completed sessions → "completed"');
            console.log('\n📝 Next steps:');
            console.log('   1. Refresh your browser (Ctrl+F5)');
            console.log('   2. Sessions should now show correct status');
            console.log('   3. Start/End buttons should appear based on timing');
        }

        console.log('\n' + '='.repeat(70));

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from database');
        
    } catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
    }
}

updateSessionStatuses();


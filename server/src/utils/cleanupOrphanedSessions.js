/**
 * Cleanup Orphaned Sessions
 * 
 * This script removes sessions that reference deleted patients, doctors, or physiotherapists.
 * Run this to clean up "N/A" sessions in the admin dashboard.
 * 
 * Run with: node --experimental-json-modules src/utils/cleanupOrphanedSessions.js
 */

import mongoose from 'mongoose';
import { Session } from '../models/sessions.models.js';
import { Patient } from '../models/patient.models.js';
import { Doctor } from '../models/doctor.models.js';
import { Physio } from '../models/physio.models.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function cleanupOrphanedSessions() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database\n');

        // Find all sessions
        const allSessions = await Session.find({});
        console.log(`📊 Total sessions found: ${allSessions.length}\n`);

        let orphanedSessions = [];
        let validSessions = 0;

        // Check each session
        for (const session of allSessions) {
            let isOrphaned = false;
            let reason = [];

            // Check if patient exists
            const patient = await Patient.findById(session.patientId);
            if (!patient) {
                isOrphaned = true;
                reason.push('Patient deleted');
            }

            // Check if doctor exists
            const doctor = await Doctor.findById(session.doctorId);
            if (!doctor) {
                isOrphaned = true;
                reason.push('Doctor deleted');
            }

            // Check if physio exists
            const physio = await Physio.findById(session.physioId);
            if (!physio) {
                isOrphaned = true;
                reason.push('Physiotherapist deleted');
            }

            if (isOrphaned) {
                orphanedSessions.push({
                    session,
                    reason: reason.join(', ')
                });
            } else {
                validSessions++;
            }
        }

        console.log('='.repeat(70));
        console.log('📋 CLEANUP SUMMARY');
        console.log('='.repeat(70));
        console.log(`✅ Valid sessions: ${validSessions}`);
        console.log(`❌ Orphaned sessions: ${orphanedSessions.length}\n`);

        if (orphanedSessions.length === 0) {
            console.log('🎉 No orphaned sessions found! Database is clean.');
            await mongoose.disconnect();
            return;
        }

        // Show orphaned sessions
        console.log('🔍 Orphaned Sessions Details:\n');
        orphanedSessions.forEach((item, index) => {
            const session = item.session;
            console.log(`${index + 1}. Session ID: ${session._id}`);
            console.log(`   Date: ${session.sessionDate}`);
            console.log(`   Surgery Type: ${session.surgeryType}`);
            console.log(`   Status: ${session.status}`);
            console.log(`   Reason: ${item.reason}`);
            console.log('   ---');
        });

        // Ask for confirmation (auto-confirm in script mode)
        console.log('\n⚠️  About to delete these orphaned sessions...\n');

        // Delete orphaned sessions
        const sessionIds = orphanedSessions.map(item => item.session._id);
        const deleteResult = await Session.deleteMany({ _id: { $in: sessionIds } });

        console.log('='.repeat(70));
        console.log('✨ CLEANUP COMPLETE!');
        console.log('='.repeat(70));
        console.log(`🗑️  Deleted ${deleteResult.deletedCount} orphaned sessions`);
        console.log(`✅ Remaining sessions: ${validSessions}`);
        console.log('='.repeat(70));

        // Disconnect
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from database');
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// Run the cleanup
cleanupOrphanedSessions();


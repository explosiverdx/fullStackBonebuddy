/**
 * Cleanup Duplicate Pending Payments
 * 
 * This script removes duplicate pending payment requests for the same 
 * appointment/session, keeping only the most recent one.
 * 
 * Run with: node --experimental-json-modules src/utils/cleanupDuplicatePayments.js
 */

import mongoose from 'mongoose';
import { Payment } from '../models/payments.models.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function cleanupDuplicatePayments() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database');

        // Find all pending payments
        const pendingPayments = await Payment.find({ status: 'pending' })
            .sort({ createdAt: -1 }); // Most recent first

        console.log(`\n📊 Found ${pendingPayments.length} pending payments`);

        // Group by patient and description (or appointment/session)
        const groupedPayments = {};
        
        for (const payment of pendingPayments) {
            const key = `${payment.patientId}_${payment.description}_${payment.amount}`;
            
            if (!groupedPayments[key]) {
                groupedPayments[key] = [];
            }
            
            groupedPayments[key].push(payment);
        }

        // Find duplicates
        let duplicatesFound = 0;
        let duplicatesRemoved = 0;

        for (const [key, payments] of Object.entries(groupedPayments)) {
            if (payments.length > 1) {
                duplicatesFound += payments.length - 1;
                
                console.log(`\n🔍 Found ${payments.length} duplicates for:`);
                console.log(`   Description: ${payments[0].description}`);
                console.log(`   Amount: ₹${payments[0].amount}`);
                
                // Keep the most recent one (first in sorted array)
                const keepPayment = payments[0];
                const removePayments = payments.slice(1);
                
                console.log(`   ✅ Keeping: ${keepPayment._id} (created: ${keepPayment.createdAt})`);
                
                for (const payment of removePayments) {
                    console.log(`   ❌ Removing: ${payment._id} (created: ${payment.createdAt})`);
                    await Payment.findByIdAndDelete(payment._id);
                    duplicatesRemoved++;
                }
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log(`✨ Cleanup Complete!`);
        console.log(`   Total pending payments: ${pendingPayments.length}`);
        console.log(`   Duplicates found: ${duplicatesFound}`);
        console.log(`   Duplicates removed: ${duplicatesRemoved}`);
        console.log(`   Remaining payments: ${pendingPayments.length - duplicatesRemoved}`);
        console.log('='.repeat(60));

        // Disconnect
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from database');
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// Run the cleanup
cleanupDuplicatePayments();


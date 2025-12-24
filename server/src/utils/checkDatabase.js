/**
 * Check Database Connection
 * 
 * Shows which database you're connected to and what collections exist
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkDatabase() {
    try {
        console.log('🔍 Checking Database Connection...\n');
        console.log('📋 Environment Variables:');
        console.log(`   MONGODB_URI: ${process.env.MONGODB_URI}`);
        console.log(`   PORT: ${process.env.PORT || '8000'}\n`);

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected successfully!\n');

        const dbName = mongoose.connection.name;
        console.log(`📊 Database Name: ${dbName}\n`);

        // List all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('📋 Collections in this database:');
        
        if (collections.length === 0) {
            console.log('   ❌ No collections found! Database is empty.\n');
        } else {
            console.log('');
            for (const collection of collections) {
                const count = await mongoose.connection.db.collection(collection.name).countDocuments();
                console.log(`   - ${collection.name}: ${count} documents`);
            }
        }

        // Show MongoDB connection URL (without password)
        const connStr = process.env.MONGODB_URI.replace(/:([^:@]+)@/, ':****@');
        console.log(`\n🔗 Connection String: ${connStr}`);

        await mongoose.disconnect();
        console.log('\n✅ Check complete!');
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

checkDatabase();


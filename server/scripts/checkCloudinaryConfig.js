/**
 * Diagnostic script to check Cloudinary configuration
 * Run this on your production server to verify Cloudinary setup
 * 
 * Usage: node scripts/checkCloudinaryConfig.js
 */

import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('🔍 Checking Cloudinary Configuration...\n');

// Check environment variables
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log('Environment Variables:');
console.log('  CLOUDINARY_CLOUD_NAME:', cloudName ? '✅ Set' : '❌ Missing');
console.log('  CLOUDINARY_API_KEY:', apiKey ? '✅ Set' : '❌ Missing');
console.log('  CLOUDINARY_API_SECRET:', apiSecret ? '✅ Set' : '❌ Missing');
console.log('');

if (!cloudName || !apiKey || !apiSecret) {
  console.error('❌ Cloudinary configuration is incomplete!');
  console.error('Please set the following environment variables:');
  console.error('  - CLOUDINARY_CLOUD_NAME');
  console.error('  - CLOUDINARY_API_KEY');
  console.error('  - CLOUDINARY_API_SECRET');
  process.exit(1);
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret
});

// Test connection by pinging Cloudinary
try {
  console.log('Testing Cloudinary connection...');
  const result = await cloudinary.api.ping();
  console.log('✅ Cloudinary connection successful!');
  console.log('  Status:', result.status);
  console.log('');
  
  // Try to get usage information (if available)
  try {
    const usage = await cloudinary.api.usage();
    console.log('Account Usage Information:');
    console.log('  Plan:', usage.plan || 'N/A');
    console.log('  Credits:');
    console.log('    - Used:', usage.credits?.used || 'N/A');
    console.log('    - Limit:', usage.credits?.limit || 'N/A');
    console.log('  Bandwidth:');
    console.log('    - Used:', usage.bandwidth?.used || 'N/A');
    console.log('    - Limit:', usage.bandwidth?.limit || 'N/A');
    console.log('');
  } catch (usageError) {
    console.log('ℹ️  Usage information not available (this is normal for some account types)');
    console.log('');
  }
  
  // Test upload directory
  const fs = await import('fs');
  const uploadDir = path.join(__dirname, '../public/uploads');
  console.log('Upload Directory Check:');
  console.log('  Path:', uploadDir);
  console.log('  Exists:', fs.existsSync(uploadDir) ? '✅ Yes' : '❌ No');
  
  if (fs.existsSync(uploadDir)) {
    try {
      fs.accessSync(uploadDir, fs.constants.W_OK);
      console.log('  Writable:', '✅ Yes');
    } catch (error) {
      console.log('  Writable:', '❌ No - Permission denied');
    }
  } else {
    console.log('  ⚠️  Directory does not exist. It will be created automatically.');
  }
  
  console.log('');
  console.log('✅ All checks passed! Cloudinary is properly configured.');
  
} catch (error) {
  console.error('❌ Cloudinary connection failed!');
  console.error('  Error:', error.message);
  console.error('');
  console.error('Possible issues:');
  console.error('  1. Invalid Cloudinary credentials');
  console.error('  2. Network connectivity issues');
  console.error('  3. Cloudinary account suspended or expired');
  process.exit(1);
}


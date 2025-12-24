/**
 * Test script to verify Cloudinary upload functionality
 * This will test if your Cloudinary credentials work for uploading images
 * 
 * Usage: node scripts/testCloudinaryUpload.js
 */

import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('🧪 Testing Cloudinary Upload Functionality...\n');

// Check environment variables
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log('Environment Variables:');
console.log('  CLOUDINARY_CLOUD_NAME:', cloudName || '❌ Missing');
console.log('  CLOUDINARY_API_KEY:', apiKey ? '✅ Set' : '❌ Missing');
console.log('  CLOUDINARY_API_SECRET:', apiSecret ? '✅ Set' : '❌ Missing');
console.log('');

if (!cloudName || !apiKey || !apiSecret) {
  console.error('❌ Cloudinary configuration is incomplete!');
  process.exit(1);
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret
});

// Test 1: Ping Cloudinary
console.log('Test 1: Testing Cloudinary connection...');
try {
  const pingResult = await cloudinary.api.ping();
  console.log('✅ Connection successful:', pingResult.status);
} catch (error) {
  console.error('❌ Connection failed:', error.message);
  process.exit(1);
}

// Test 2: Create a simple test image and upload it
console.log('\nTest 2: Testing image upload...');

// Create a simple 1x1 pixel PNG image (base64)
const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const testImageBuffer = Buffer.from(testImageBase64, 'base64');

// Save to temporary file
const testImagePath = path.join(__dirname, '../public/uploads/test-image.png');
const uploadDir = path.dirname(testImagePath);

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

fs.writeFileSync(testImagePath, testImageBuffer);
console.log('  Created test image:', testImagePath);

try {
  const uploadResult = await cloudinary.uploader.upload(testImagePath, {
    resource_type: 'image',
    folder: 'test-uploads',
    public_id: `test-${Date.now()}`
  });

  if (uploadResult && (uploadResult.secure_url || uploadResult.url)) {
    const imageUrl = uploadResult.secure_url || uploadResult.url;
    console.log('✅ Upload successful!');
    console.log('  URL:', imageUrl);
    console.log('  Public ID:', uploadResult.public_id);
    console.log('  Format:', uploadResult.format);
    console.log('  Size:', uploadResult.bytes, 'bytes');
    
    // Clean up test file
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
      console.log('  🗑️  Test file cleaned up');
    }
    
    // Try to delete the uploaded image from Cloudinary
    try {
      await cloudinary.uploader.destroy(uploadResult.public_id);
      console.log('  🗑️  Test image deleted from Cloudinary');
    } catch (deleteError) {
      console.log('  ⚠️  Could not delete test image from Cloudinary (this is okay)');
    }
    
    console.log('\n✅ All tests passed! Cloudinary is working correctly.');
  } else {
    console.error('❌ Upload failed: Invalid response');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Upload failed!');
  console.error('  Error:', error.message);
  console.error('  Code:', error.http_code || error.status || 'N/A');
  console.error('  Details:', error.error || 'N/A');
  
  // Clean up test file
  if (fs.existsSync(testImagePath)) {
    fs.unlinkSync(testImagePath);
  }
  
  console.error('\n❌ Cloudinary upload test failed. Please check:');
  console.error('  1. Your Cloudinary credentials are correct');
  console.error('  2. Your Cloudinary account is active');
  console.error('  3. Network connectivity to Cloudinary');
  console.error('  4. Cloudinary account limits/quotas');
  process.exit(1);
}


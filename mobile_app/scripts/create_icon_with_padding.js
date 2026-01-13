/**
 * Script to create a properly padded logo for Android adaptive icons
 * This adds transparent padding around the logo to prevent cropping
 * 
 * Requires: npm install sharp
 * Usage: node scripts/create_icon_with_padding.js
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function createPaddedIcon() {
  try {
    const inputPath = path.join(__dirname, '../assets/images/logo.png');
    const outputPath = path.join(__dirname, '../assets/images/logo_icon_padded.png');
    
    // Get original image dimensions
    const metadata = await sharp(inputPath).metadata();
    const originalWidth = metadata.width;
    const originalHeight = metadata.height;
    
    // Calculate padding: Add 50% padding on each side (so logo is 50% of final size)
    // This ensures logo fits within the 66% safe zone of adaptive icons
    const padding = Math.max(originalWidth, originalHeight) * 0.5;
    const newWidth = originalWidth + (padding * 2);
    const newHeight = originalHeight + (padding * 2);
    
    // Create new image with transparent background
    const paddedImage = await sharp({
      create: {
        width: newWidth,
        height: newHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent
      }
    })
    .composite([
      {
        input: inputPath,
        left: Math.round(padding),
        top: Math.round(padding)
      }
    ])
    .png()
    .toFile(outputPath);
    
    console.log('✅ Created padded icon:', outputPath);
    console.log(`   Original: ${originalWidth}x${originalHeight}`);
    console.log(`   Padded: ${newWidth}x${newHeight}`);
    console.log(`   Logo size in padded icon: ${originalWidth}x${originalHeight} (${(originalWidth/newWidth*100).toFixed(1)}% of total)`);
    
  } catch (error) {
    console.error('❌ Error creating padded icon:', error.message);
    console.log('\n💡 Alternative: Install sharp first:');
    console.log('   cd mobile_app && npm install sharp');
  }
}

createPaddedIcon();


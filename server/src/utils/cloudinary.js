import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv', '.mpeg', '.mpg'];
const rawExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt', '.zip', '.rar'];

const getResourceType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  if (imageExtensions.includes(ext)) return 'image';
  if (videoExtensions.includes(ext)) return 'video';
  if (rawExtensions.includes(ext)) return 'raw';
  return 'auto';
};

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      console.error('❌ Cloudinary upload: No file path provided');
      return null;
    }

    // Validate Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('❌ Cloudinary configuration missing:', {
        cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
        api_key: !!process.env.CLOUDINARY_API_KEY,
        api_secret: !!process.env.CLOUDINARY_API_SECRET
      });
      throw new Error('Cloudinary configuration is incomplete. Please check environment variables.');
    }

    // Check if file exists
    if (!fs.existsSync(localFilePath)) {
      console.error('❌ Cloudinary upload: File does not exist at path:', localFilePath);
      return null;
    }

    const stats = fs.statSync(localFilePath);
    const fileSizeInMB = stats.size / (1024 * 1024);
    const resourceType = getResourceType(localFilePath);

    console.log('📤 Uploading to Cloudinary:', {
      path: localFilePath,
      size: `${fileSizeInMB.toFixed(2)} MB`,
      resourceType: resourceType
    });

    const uploadOptions = {
      resource_type: resourceType,
      chunk_size: 6000000,
      timeout: 120000,
      use_filename: true,
      unique_filename: true
    };

    if (resourceType === 'video' && fileSizeInMB > 20) {
      uploadOptions.eager_async = true;
      uploadOptions.eager = [{ quality: 'auto' }];
    }

    const response = await cloudinary.uploader.upload(localFilePath, uploadOptions);

    if (!response || !response.secure_url) {
      console.error('❌ Cloudinary upload: Invalid response received');
      return null;
    }

    console.log('✅ File uploaded to Cloudinary successfully:', response.secure_url || response.url);
    
    // Clean up local file
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
      console.log('🗑️ Local file cleaned up:', localFilePath);
    }
    
    return response;
  } catch (error) {
    console.error('❌ Cloudinary upload error:', {
      message: error.message,
      stack: error.stack,
      filePath: localFilePath
    });
    
    // Clean up local file on error
    if (localFilePath && fs.existsSync(localFilePath)) {
      try {
        fs.unlinkSync(localFilePath);
        console.log('🗑️ Local file cleaned up after error:', localFilePath);
      } catch (cleanupError) {
        console.error('❌ Error cleaning up file:', cleanupError);
      }
    }
    
    return null;
  }
};

const deleteFromCloudinary = async (publicId, resourceType = 'video') => {
  try {
    if (!publicId) return null;
    
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    
    console.log('File deleted from Cloudinary:', publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };

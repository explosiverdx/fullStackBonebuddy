import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

// Configure Cloudinary - will be reconfigured if needed
const configureCloudinary = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  
  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret
    });
    console.log('🔧 Cloudinary configured:', { cloud_name: cloudName, api_key: apiKey ? '***' + apiKey.slice(-4) : 'missing' });
    return true;
  }
  console.error('❌ Cloudinary configuration incomplete:', {
    cloud_name: !!cloudName,
    api_key: !!apiKey,
    api_secret: !!apiSecret
  });
  return false;
};

// Initial configuration (may not have env vars yet, will reconfigure on use)
configureCloudinary();

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

    // Reconfigure Cloudinary to ensure env vars are loaded (important for PM2)
    // This is critical because PM2 might not have loaded env vars when module was first imported
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    
    console.log('🔍 Checking Cloudinary config before upload:', {
      has_cloud_name: !!cloudName,
      has_api_key: !!apiKey,
      has_api_secret: !!apiSecret,
      cloud_name: cloudName || 'MISSING',
      api_key: apiKey ? '***' + apiKey.slice(-4) : 'MISSING'
    });
    
    if (!cloudName || !apiKey || !apiSecret) {
      console.error('❌ Cloudinary configuration missing at upload time:', {
        cloud_name: !!cloudName,
        api_key: !!apiKey,
        api_secret: !!apiSecret,
        all_env_keys: Object.keys(process.env).filter(k => k.includes('CLOUDINARY'))
      });
      throw new Error('Cloudinary configuration is incomplete. Please check environment variables.');
    }
    
    // Force reconfigure Cloudinary with current env vars
    // Clear any existing config first
    cloudinary.config({
      cloud_name: undefined,
      api_key: undefined,
      api_secret: undefined
    });
    
    // Set new config
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret
    });
    
    // Verify config was set
    const currentConfig = cloudinary.config();
    console.log('✅ Cloudinary reconfigured for upload:', {
      config_cloud_name: currentConfig.cloud_name || 'NOT SET',
      config_has_api_key: !!currentConfig.api_key,
      env_cloud_name: cloudName,
      env_has_api_key: !!apiKey
    });

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
      unique_filename: true,
      // Explicitly pass credentials in options as backup
      api_key: apiKey,
      api_secret: apiSecret,
      cloud_name: cloudName
    };

    if (resourceType === 'video' && fileSizeInMB > 20) {
      uploadOptions.eager_async = true;
      uploadOptions.eager = [{ quality: 'auto' }];
    }

    console.log('🚀 Attempting Cloudinary upload with config:', {
      cloud_name: cloudName,
      has_api_key: !!apiKey,
      has_api_secret: !!apiSecret,
      file_path: localFilePath
    });

    const response = await cloudinary.uploader.upload(localFilePath, uploadOptions);

    if (!response) {
      console.error('❌ Cloudinary upload: No response received');
      return null;
    }

    // Check if we have a valid URL (either secure_url or url)
    if (!response.secure_url && !response.url) {
      console.error('❌ Cloudinary upload: Invalid response - no URL found', {
        responseKeys: Object.keys(response),
        response: response
      });
      return null;
    }

    const imageUrl = response.secure_url || response.url;
    console.log('✅ File uploaded to Cloudinary successfully:', imageUrl);
    
    // Clean up local file
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
      console.log('🗑️ Local file cleaned up:', localFilePath);
    }
    
    return response;
  } catch (error) {
    console.error('❌ Cloudinary upload error:', {
      message: error.message,
      name: error.name,
      code: error.http_code || error.status || 'N/A',
      error: error.error || 'N/A',
      stack: error.stack,
      filePath: localFilePath
    });
    
    // Provide more specific error information
    let errorMessage = 'Unknown error';
    if (error.http_code === 401) {
      errorMessage = 'Cloudinary authentication failed. Please check your API credentials.';
    } else if (error.http_code === 400) {
      errorMessage = `Cloudinary upload failed: ${error.message || 'Invalid request'}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    console.error('❌ Error details:', errorMessage);
    
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

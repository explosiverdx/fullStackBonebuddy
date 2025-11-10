import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        
        // Check file size
        const stats = fs.statSync(localFilePath);
        const fileSizeInMB = stats.size / (1024 * 1024);
        
        // Upload the file on Cloudinary with proper settings for videos
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto',
            chunk_size: 6000000, // 6MB chunks for large files
            timeout: 120000, // 2 minutes timeout for large videos
            ...(fileSizeInMB > 20 && { 
                eager_async: true, // Process large videos asynchronously
                eager: [{ quality: 'auto' }]
            })
        });
        
        // File has been uploaded successfully
        console.log('File uploaded to Cloudinary:', response.url);
        fs.unlinkSync(localFilePath); // Remove the locally saved temporary file
        return response;
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        // Remove the locally saved temporary file
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return null;
    }
}

export { uploadOnCloudinary };

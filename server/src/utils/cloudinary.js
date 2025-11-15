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
    if (!localFilePath) return null;

    const stats = fs.statSync(localFilePath);
    const fileSizeInMB = stats.size / (1024 * 1024);
    const resourceType = getResourceType(localFilePath);

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

    console.log('File uploaded to Cloudinary:', response.secure_url || response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    return null;
  }
};

export { uploadOnCloudinary };

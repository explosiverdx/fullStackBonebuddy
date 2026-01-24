import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Get absolute path to upload directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "../public/uploads");

// Ensure upload directory exists and is writable
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('✅ Created upload directory:', uploadDir);
}

// Check if directory is writable
try {
  fs.accessSync(uploadDir, fs.constants.W_OK);
  console.log('✅ Upload directory is writable:', uploadDir);
} catch (error) {
  console.error('❌ Upload directory is not writable:', uploadDir, error);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      // Ensure directory exists before saving
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      console.log('📁 Saving file to:', uploadDir);
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname))
    }
  })

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|heic|bmp|pdf|doc|docx|mp4|mov|avi|mkv|webm|flv|wmv/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = /image|pdf|video|msword|openxmlformats/.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images (JPEG, JPG, PNG, GIF, WebP, HEIC, BMP), PDF, Word (.doc, .docx), and videos are allowed!'));
  }
};

export const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for videos
    fileFilter
})

import formidable from "formidable";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "../public/uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Parses multipart/form-data and populates req.body (all fields including
 * state, city, pincode) and req.files (array compatible with updateProfile).
 * Multer does not put non-file fields in req.body, so we use formidable
 * for /profile to ensure state, city, pincode from registration are available.
 */
export function parseMultipartForm(req, res, next) {
  const contentType = req.headers["content-type"] || "";
  if (!contentType.includes("multipart/form-data")) {
    return next();
  }

  const form = formidable({
    uploadDir,
    keepExtensions: true,
    maxFileSize: 100 * 1024 * 1024,
  });

  form.parse(req, (err, fields, files) => {
    if (err) {
      return next(err);
    }
    // Populate req.body: formidable gives { key: [val] }, we need { key: val }
    req.body = {};
    for (const [k, v] of Object.entries(fields || {})) {
      req.body[k] = Array.isArray(v) && v.length ? v[0] : v;
    }
    // Build req.files as array of { fieldname, filename } to match multer-like shape expected by updateProfile
    const filesArray = [];
    for (const [fieldname, f] of Object.entries(files || {})) {
      const arr = Array.isArray(f) ? f : f ? [f] : [];
      for (const file of arr) {
        if (file && (file.filepath || file.path)) {
          const filepath = file.filepath || file.path;
          const base = path.basename(String(filepath));
          filesArray.push({ fieldname, filename: base, path: filepath });
        }
      }
    }
    req.files = filesArray;
    next();
  });
}

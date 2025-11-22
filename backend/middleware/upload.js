const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');
const { v4: uuidv4 } = require('uuid');

// Ensure upload directory exists
const uploadDir = config.upload.dir;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user?.id || 'temp';
    const userDir = path.join(uploadDir, userId);
    
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  if (config.upload.allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${config.upload.allowedTypes.join(', ')}`), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: config.upload.maxSize
  },
  fileFilter: fileFilter
});

// Single file upload
const uploadSingle = upload.single('audio');

// Multiple files upload
const uploadMultiple = upload.array('audio', 50); // Max 50 files

module.exports = {
  single: uploadSingle,
  multiple: uploadMultiple,
  upload
};


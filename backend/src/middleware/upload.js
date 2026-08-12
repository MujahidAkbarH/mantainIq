const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary credentials from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'mock_cloud',
  api_key: process.env.CLOUDINARY_API_KEY || 'mock_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'mock_secret',
});

// Configure Multer memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Allow common image and video formats
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Only image and video uploads are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB file size limit
  },
});

// Middleware function to handle upload
const uploadSingle = (req, res, next) => {
  const multerMiddleware = upload.single('evidence');

  multerMiddleware(req, res, async function (err) {
    if (err) {
      console.warn('[Upload Middleware] Multer parsing failed:', err.message);
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    if (!req.file) {
      // No file uploaded, proceed to next middleware
      return next();
    }

    try {
      console.log(`[Upload Middleware] Uploading ${req.file.originalname} to Cloudinary...`);
      
      // Convert file buffer to base64 Data URL string
      const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(fileStr, {
        folder: 'maintainiq_evidence',
        resource_type: 'auto',
      });

      console.log('[Upload Middleware] Cloudinary upload successful:', result.secure_url);
      req.file.cloudinaryUrl = result.secure_url;
      next();
    } catch (uploadErr) {
      console.error('[Upload Middleware] Cloudinary upload failed, handling gracefully:', uploadErr.message || uploadErr);
      
      // Provide a safe fallback mock image and append error details to request
      req.file.cloudinaryUrl = 'https://res.cloudinary.com/demo/image/upload/v1582218416/sample.jpg';
      req.file.cloudinaryError = uploadErr.message || 'Unknown Cloudinary error';
      next();
    }
  });
};

module.exports = {
  uploadSingle,
};

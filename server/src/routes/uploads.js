import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { requireAuth } from '../middleware/auth.js';
import { env } from '../config/env.js';
import { ApiError } from '../middleware/errorHandler.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
});

router.post('/image', requireAuth, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) throw new ApiError(400, 'No image file provided');
    if (!env.cloudinary.cloudName) {
      throw new ApiError(503, 'Image upload is not configured (missing Cloudinary env vars)');
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'blog-platform' },
        (err, uploaded) => (err ? reject(err) : resolve(uploaded))
      );
      stream.end(req.file.buffer);
    });

    res.status(201).json({ url: result.secure_url });
  } catch (err) {
    next(err);
  }
});

export default router;

/**
 * Product image uploads — AWS S3 (preferred if configured) or Cloudinary.
 * AWS SDK is required only when uploading to S3 (avoids startup warning if unused).
 * @see NODEJS_API_GENERATION_PROMPT.md — Cloud Storage / image uploads
 */
const cloudinary = require('cloudinary').v2;
const path = require('path');
const logger = require('./logger');

function isS3Configured() {
  return Boolean(
    process.env.AWS_S3_BUCKET &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY
  );
}

function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
  );
}

function configureCloudinary() {
  if (!isCloudinaryConfigured()) return false;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  return true;
}

function getS3Client() {
  const AWS = require('aws-sdk');
  return new AWS.S3({
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  });
}

function sanitizeFilename(name) {
  const base = name ? path.basename(name) : 'image';
  return base.replace(/[^a-zA-Z0-9._-]/g, '_') || 'image';
}

/**
 * Upload buffer to S3; returns public object URL (configure bucket policy for public read).
 */
async function uploadProductImageToS3(buffer, filename, mimetype) {
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION || 'us-east-1';
  const key = `businexa-products/${Date.now()}-${sanitizeFilename(filename)}`;
  const s3 = getS3Client();

  await s3
    .putObject({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: mimetype || 'application/octet-stream',
      CacheControl: 'max-age=31536000',
    })
    .promise();

  const base = (process.env.AWS_S3_PUBLIC_BASE_URL || '').replace(/\/$/, '');
  if (base) {
    return `${base}/${key}`;
  }
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

/**
 * Upload buffer to Cloudinary; returns secure_url.
 */
async function uploadProductImageToCloudinary(buffer, filename, _mimetype) {
  if (!configureCloudinary()) {
    throw new Error('Cloudinary not configured');
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'businexa-products',
        resource_type: 'image',
        public_id: sanitizeFilename(filename).replace(/\.[^.]+$/, '') || undefined,
      },
      (err, result) => {
        if (err) {
          logger.error('Cloudinary upload failed', { err: err.message });
          return reject(err);
        }
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

/**
 * Upload product image: S3 if configured, else Cloudinary.
 * @param {Buffer} buffer
 * @param {string} filename Original filename
 * @param {string} [mimetype]
 * @returns {Promise<string>} Public URL
 */
async function uploadProductImage(buffer, filename, mimetype) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error('Invalid image buffer');
  }

  if (isS3Configured()) {
    return uploadProductImageToS3(buffer, filename, mimetype);
  }
  if (isCloudinaryConfigured()) {
    return uploadProductImageToCloudinary(buffer, filename, mimetype);
  }

  throw new Error(
    'No storage configured: set AWS_S3_BUCKET + AWS keys, or CLOUDINARY_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET'
  );
}

async function deleteObject(_keyOrPublicId) {
  return false;
}

module.exports = {
  uploadProductImage,
  uploadProductImageToS3,
  uploadProductImageToCloudinary,
  deleteObject,
  isS3Configured,
  isCloudinaryConfigured,
};

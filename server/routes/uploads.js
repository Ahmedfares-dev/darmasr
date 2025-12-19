const express = require('express');
const router = express.Router();
const { getPresignedUrl, getPublicUrl } = require('../utils/s3');
const { S3Client, HeadBucketCommand } = require('@aws-sdk/client-s3');

// Test S3 connection
router.get('/test', async (req, res) => {
  try {
    const s3 = new S3Client({
      region: process.env.S3_REGION || 'us-central-1',
      endpoint: process.env.S3_ENDPOINT || 'https://usc1.contabostorage.com',
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
      },
    });

    const command = new HeadBucketCommand({ Bucket: process.env.S3_BUCKET });
    await s3.send(command);
    
    res.json({ 
      success: true,
      message: 'S3 connection successful',
      config: {
        bucket: process.env.S3_BUCKET,
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION
      }
    });
  } catch (error) {
    console.error('S3 test error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      code: error.code,
      config: {
        bucket: process.env.S3_BUCKET,
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION
      }
    });
  }
});

// Get presigned URL for direct upload
router.post('/presign', async (req, res) => {
  try {
    const { key, contentType } = req.body;
    if (!key || !contentType) {
      return res.status(400).json({ error: 'مطلوب المفتاح ونوع المحتوى' });
    }

    // Validate environment variables
    if (!process.env.S3_BUCKET || !process.env.S3_ACCESS_KEY || !process.env.S3_SECRET_KEY) {
      console.error('Missing S3 configuration:', {
        bucket: !!process.env.S3_BUCKET,
        accessKey: !!process.env.S3_ACCESS_KEY,
        secretKey: !!process.env.S3_SECRET_KEY
      });
      return res.status(500).json({ error: 'تكوين التخزين غير مكتمل' });
    }

    const result = await getPresignedUrl(key, contentType);
    
    // Log the full URL for debugging (first 200 chars only)
    console.log('Returning presigned URL (preview):', result.presignedUrl.substring(0, 200));
    
    res.json({ 
      url: result.presignedUrl,
      publicUrl: result.publicUrl 
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    res.status(500).json({ 
      error: error.message || 'فشل في إنشاء رابط الرفع',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;


const { S3Client, PutObjectCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3 = new S3Client({
  region: process.env.S3_REGION || 'us-central-1',
  endpoint: process.env.S3_ENDPOINT || 'https://usc1.contabostorage.com',
  forcePathStyle: true, // Required for Contabo - uses path-style URLs
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
  // Add retry configuration
  maxAttempts: 3,
});

function getPublicUrl(key) {
  // Construct public URL for Contabo Object Storage
  // Contabo format: https://endpoint/STORAGE_ID:BUCKET_NAME/key
  // With forcePathStyle: true, the URL format is: https://endpoint/bucket/key
  const endpoint = process.env.S3_ENDPOINT || 'https://usc1.contabostorage.com';
  const bucket = process.env.S3_BUCKET;
  
  // Remove trailing slash from endpoint if present
  const cleanEndpoint = endpoint.replace(/\/$/, '');
  
  // Construct the public URL
  // Bucket already includes storage ID if provided (format: STORAGE_ID:BUCKET_NAME)
  return `${cleanEndpoint}/${bucket}/${key}`;
}

async function verifyBucketExists() {
  try {
    const command = new HeadBucketCommand({ Bucket: process.env.S3_BUCKET });
    await s3.send(command);
    return true;
  } catch (error) {
    console.error('Bucket verification failed:', {
      bucket: process.env.S3_BUCKET,
      error: error.message,
      code: error.code
    });
    return false;
  }
}

async function getPresignedUrl(key, contentType) {
  try {
    const bucket = process.env.S3_BUCKET;
    const endpoint = process.env.S3_ENDPOINT || 'https://usc1.contabostorage.com';
    
    if (!bucket) {
      throw new Error('S3_BUCKET environment variable is not set');
    }
    
    console.log('Generating presigned URL with config:', {
      bucket,
      endpoint,
      region: process.env.S3_REGION,
      key,
      contentType
    });
    
    // Verify bucket exists (optional check, can be disabled for performance)
    if (process.env.S3_VERIFY_BUCKET !== 'false') {
      const bucketExists = await verifyBucketExists();
      if (!bucketExists) {
        throw new Error(`Bucket "${bucket}" does not exist or is not accessible. Please verify the bucket name and credentials.`);
      }
    }
    
    // Build command without ACL first (some S3-compatible services don't support ACL in presigned URLs)
    const commandParams = {
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    };
    
    // Only add ACL if explicitly enabled (Contabo may not support it in presigned URLs)
    if (process.env.S3_USE_ACL === 'true') {
      commandParams.ACL = 'public-read';
    }

    const command = new PutObjectCommand(commandParams);
    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 minutes
    
    // Get the public URL that will be accessible after upload
    const publicUrl = getPublicUrl(key);
    
    console.log('Generated presigned URL:', {
      key,
      presignedUrlPreview: presignedUrl.substring(0, 150),
      publicUrl
    });
    
    return {
      presignedUrl,
      publicUrl
    };
  } catch (error) {
    console.error('S3 presigned URL error:', {
      bucket: process.env.S3_BUCKET,
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION,
      key: key,
      error: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack
    });
    throw error;
  }
}

module.exports = { getPresignedUrl, getPublicUrl };


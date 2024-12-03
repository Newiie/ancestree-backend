const {S3Client, PutObjectCommand, GetObjectCommand} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require('crypto');

const uniqueFileName = (fileName) => {
    const hash = crypto.createHash('sha256').update(fileName).digest('hex');
    return hash;
};

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const getUrlImage = async (fileName) => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
  });
  return await getSignedUrl(s3, command, {
    expiresIn: 3600,
  });
};

const uploadToS3 = async (file, fileName, user) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `${user}-${fileName}`,
    Body: file.buffer,
    ContentType: file.mimetype
  };

  console.log("Params ", params);

  const command = new PutObjectCommand(params);
  await s3.send(command);
};

module.exports = { uploadToS3, getUrlImage };

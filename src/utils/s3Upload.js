// import AWS from 'aws-sdk';
// import dotenv from 'dotenv';

// dotenv.config();

// const s3 = new AWS.S3({
//     region: process.env.AWS_REGION,
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
// });

// const uploadToS3 = (file) => {
//     const params = {
//         Bucket: process.env.AWS_BUCKET_NAME,
//         Key: `${Date.now()}-${file.originalname}`,
//         Body: file.buffer,
//         ContentType: file.mimetype,
//         ACL: 'public-read', // or 'private' if needed
//     };

//     return s3.upload(params).promise();
// };
// export default uploadToS3;


import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

export const uploadToS3 = async (file) => {
    const safeFileName = file.originalname.replace(/\s/g, "_");
    const key = `${Date.now()}-${safeFileName}`;

    await s3.send(
        new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
        })
    );
    // Direct permanent URL
    const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    return { key, url };
};
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Create a reusable S3 client
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

/**
 * Extract the actual S3 key from a URL or return the key if it's already clean
 */
const extractKey = (keyOrUrl) => {
    if (!keyOrUrl) return null;

    try {
        // If it's a full S3 URL, extract the pathname after the bucket domain
        if (keyOrUrl.startsWith("http")) {
            const url = new URL(keyOrUrl);
            return decodeURIComponent(url.pathname.replace(/^\/+/, ""));
        }
        // Otherwise return as-is (already a key)
        return keyOrUrl.trim();
    } catch {
        return keyOrUrl.trim();
    }
};

/**
 * Generate a signed URL for a single file
 * @param {string} key - S3 object key or URL
 * @returns {Promise<string|null>}
 */
export const getFileUrl = async (key) => {
    if (!key || typeof key !== "string") {
        console.warn("⚠️ Skipping invalid S3 key:", key);
        return null;
    }

    try {
        const cleanKey = extractKey(key);
        console.log("🚀 Generating signed URL for clean key:", cleanKey);

        const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: cleanKey,
        });

        // Signed URL valid for 1 hour
        return await getSignedUrl(s3, command, { expiresIn: 3600 });
    } catch (error) {
        console.error("❌ Error generating signed URL for key:", key, error);
        return null;
    }
};

/**
 * Generate signed URLs for multiple files
 * @param {string[]} keys - Array of S3 object keys or URLs
 * @returns {Promise<string[]>}
 */
export const getMultipleFileUrls = async (keys) => {
    if (!Array.isArray(keys) || keys.length === 0) {
        console.warn("⚠️ No S3 keys provided for multiple URL generation");
        return [];
    }

    const urls = await Promise.all(keys.map((key) => getFileUrl(key)));

    // Filter out null values (failed generations)
    return urls.filter((url) => Boolean(url));
};

import { v2 as cloudinary } from "cloudinary";

let configured = false;

function ensureConfig() {
  if (configured) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  configured = true;
}

export async function uploadImage(
  file: File,
  options: { folder?: string; transformation?: string } = {}
): Promise<string> {
  ensureConfig();

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || "weedhub",
        transformation: options.transformation || "c_fill,w_800,h_800,q_auto",
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Upload failed"));
        } else {
          resolve(result.secure_url);
        }
      }
    );

    const { Readable } = require("stream");
    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
  });
}

export function getImageUrl(
  publicId: string,
  options: { width?: number; height?: number } = {}
): string {
  ensureConfig();
  const { width = 400, height = 400 } = options;
  return cloudinary.url(publicId, {
    width,
    height,
    crop: "fill",
    quality: "auto",
    format: "webp",
  });
}

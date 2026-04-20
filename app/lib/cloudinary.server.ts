import { v2 as cloudinary } from "cloudinary";
import { Readable } from "node:stream";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "./upload-config";

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

const ALLOWED_TYPES = new Set<string>(ALLOWED_IMAGE_TYPES);

export class UploadError extends Error {
  constructor(
    message: string,
    public code: "too_large" | "bad_type" | "upload_failed" | "no_file"
  ) {
    super(message);
  }
}

export function validateImage(file: File | null | undefined): file is File {
  if (!file || typeof file === "string") return false;
  if (file.size === 0) return false;
  if (file.size > MAX_IMAGE_BYTES) {
    throw new UploadError("La imagen supera 5 MB.", "too_large");
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new UploadError("Formato no permitido. Usa JPG, PNG, WEBP o GIF.", "bad_type");
  }
  return true;
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
          reject(new UploadError(error?.message || "Upload failed", "upload_failed"));
        } else {
          resolve(result.secure_url);
        }
      }
    );

    Readable.from(buffer).pipe(uploadStream);
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

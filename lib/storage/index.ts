import fs from "fs/promises";
import path from "path";

export interface StorageProvider {
  upload(fileBuffer: Buffer, filename: string, mimeType: string): Promise<string>;
  delete(fileUrl: string): Promise<void>;
}

class LocalStorageProvider implements StorageProvider {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), "public", "uploads");
  }

  async upload(fileBuffer: Buffer, originalFilename: string, _mimeType?: string): Promise<string> {
    await fs.mkdir(this.uploadDir, { recursive: true });

    const ext = path.extname(originalFilename) || ".jpg";
    const baseName = path.basename(originalFilename, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    const uniqueName = `${Date.now()}_${baseName}${ext}`;
    const filePath = path.join(this.uploadDir, uniqueName);

    await fs.writeFile(filePath, fileBuffer);
    return `/uploads/${uniqueName}`;
  }

  async delete(fileUrl: string): Promise<void> {
    try {
      if (!fileUrl.startsWith("/uploads/")) return;
      const fileName = path.basename(fileUrl);
      const filePath = path.join(this.uploadDir, fileName);
      await fs.unlink(filePath);
    } catch {
      // Ignore if file doesn't exist
    }
  }
}

class CloudinaryStorageProvider implements StorageProvider {
  private localFallback = new LocalStorageProvider();

  constructor(cloudName: string, apiKey: string, apiSecret: string) {
    // Configure Cloudinary SDK
    try {
      const { v2: cloudinary } = require("cloudinary");
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
    } catch (err) {
      console.warn("Failed to initialize Cloudinary SDK:", err);
    }
  }

  async upload(fileBuffer: Buffer, filename: string, mimeType: string): Promise<string> {
    try {
      const { v2: cloudinary } = await import("cloudinary");
      const cleanFileName = path.basename(filename, path.extname(filename)).replace(/[^a-zA-Z0-9_-]/g, "_");

      const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "dwara_collections",
            public_id: `${Date.now()}_${cleanFileName}`,
            resource_type: "image",
            quality: "auto",
            fetch_format: "auto",
          },
          (error: any, result: any) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(fileBuffer);
      });

      return uploadResult.secure_url;
    } catch (cloudErr) {
      console.warn("Cloudinary upload failed, falling back to local storage:", cloudErr);
      return this.localFallback.upload(fileBuffer, filename, mimeType);
    }
  }

  async delete(fileUrl: string): Promise<void> {
    try {
      if (fileUrl.startsWith("/uploads/")) {
        await this.localFallback.delete(fileUrl);
        return;
      }
      const { v2: cloudinary } = await import("cloudinary");
      const matches = fileUrl.match(/\/dwara_collections\/([^/.]+)/);
      if (matches && matches[1]) {
        await cloudinary.uploader.destroy(`dwara_collections/${matches[1]}`);
      }
    } catch (err) {
      console.warn("Image deletion failed:", err);
    }
  }
}

export function getStorageProvider(): StorageProvider {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (cloudName && apiKey && apiSecret && cloudName !== "root" && cloudName !== "your_cloud_name") {
    return new CloudinaryStorageProvider(cloudName, apiKey, apiSecret);
  }

  return new LocalStorageProvider();
}
